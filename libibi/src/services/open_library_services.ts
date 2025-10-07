// Client di collegamento e ricerca dall'API Open Library.
// Permette di cercare libri tramite parole chiave.

import type { Books, Authors, Book_Authors } from '../generated/prisma';
import { OpenLibraryBookResult, OpenLibraryAuthorResult } from '@/types/openLibrary';

export class OpenLibraryService {
  // URL endpoint dell'API Open Library
  private static readonly SEARCH_API_URL = "https://openlibrary.org/search.json";
  private static readonly BOOK_DETAILS_URL = "https://openlibrary.org/works/{0}.json";
  private static readonly AUTHOR_DETAILS_URL = "https://openlibrary.org/authors/{0}.json";

  // Configurazione timeout e limite risultati
  private static readonly HTTP_TIMEOUT_SECONDS = 5000; // Timeout ridotto a 5 secondi
  private static readonly MAX_SEARCH_RESULTS = 15; // Ridotto per migliorare prestazioni

  constructor() {}

  public transformToPrismaFormat(books: OpenLibraryBookResult[]): Partial<Books>[] {
    return books.map(book => {
      // Create a unique ID for external books
      const bookID = `ol_${book.workKey || Math.random().toString(36).substring(2, 10)}`;
      
      // Transform to match Prisma Books schema
      const prismaBook: Partial<Books> & { isExternal: boolean; Book_Authors: Partial<Book_Authors>[] } = {
        bookID: bookID,
        title: book.title || 'Unknown Title',
        firstPublicationYear: book.firstPublishYear,
        pageNumber: book.numberOfPagesMedian,
        averageRating: book.rating,
        bookDescription: book.description,
        coverImageURL: book.coverUrl,
        subjectsJson: book.subject ? JSON.stringify(book.subject) : null,
        // Add flag to identify external results (not in schema but useful)
        isExternal: true,
        // Include Book_Authors relation
        Book_Authors: []
      };

      // Add author relationships if available
      if (book.author && book.authorKey) {
        prismaBook.Book_Authors = book.author.map((authorName: string, index: number) => {
          const authorID = `ol_${book.authorKey?.[index] || 'unknown'}`;
          
          return {
            bookID: bookID,
            authorID: authorID,
            Authors: {
              authorID: authorID,
              authorName: authorName || 'Unknown Author',
              birthName: null,
              birthDate: null,
              mostFamousWork: null,
              totalWorks: null,
              biography: null,
              imageUrl: null
            } as Partial<Authors>
          } as Partial<Book_Authors>;
        });
      }

      return prismaBook;
    });
  }

  /**
   * Search and return books in Prisma format
   */
  public async searchBooksAsPrismaFormat(searchQuery: string): Promise<Partial<Books>[]> {
    const books = await this.getListBookAsync(searchQuery);
    return this.transformToPrismaFormat(books);
  }

  public async getListBookAsync(searchQuery: string): Promise<OpenLibraryBookResult[]> {
    try {
      // Costruisce URL con parametri di ricerca
      const searchParams = new URLSearchParams({
        q: searchQuery,
        limit: OpenLibraryService.MAX_SEARCH_RESULTS.toString(),
        fields: "key,title,author_name,author_key,cover_i,ratings_average"
      });

      const apiUrl = `${OpenLibraryService.SEARCH_API_URL}?${searchParams.toString()}`;
      
      console.log(`Ricerca API per "${searchQuery}"`);
      
      // Chiamata API con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OpenLibraryService.HTTP_TIMEOUT_SECONDS);

      const httpResponse = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Libibi (federico.filice@studenti.unipr.it)',
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        next: { revalidate: 3600 } // Cache per 1 ora
      });

      clearTimeout(timeoutId);

      if (!httpResponse.ok) {
        throw new Error(`HTTP error! status: ${httpResponse.status}`);
      }

      const apiResponse = await httpResponse.json();

      if (!apiResponse.docs || !Array.isArray(apiResponse.docs)) {
        return [];
      }

      const booksList: OpenLibraryBookResult[] = [];
      for (const bookDocument of apiResponse.docs) {
        try {
          const authorNamesList = this.extractAuthorNamesFromDocument(bookDocument);
          const bookCoverUrl = this.extractCoverImageUrl(bookDocument);
          const authorKeysList = this.extractAuthorKeysFromDocument(bookDocument);

          booksList.push({
            title: this.getBookTitle(bookDocument),
            author: authorNamesList,
            coverUrl: bookCoverUrl,
            rating: this.getBookRating(bookDocument),
            authorKey: authorKeysList,
            workKey: this.getCleanWorkKey(bookDocument)
          });
        } catch (ex) {
          console.error(`Errore elaborazione libro: ${ex}`);
        }
      }
      return booksList;
    } catch (ex) {
      console.error(`Errore ricerca libri: ${ex}`);
      return [];
    }
  }

  public async getBookAsync(workKey: string): Promise<OpenLibraryBookResult | null> {
    try {
      // Chiamata API per dettagli libro
      const bookDetailsUrl = OpenLibraryService.BOOK_DETAILS_URL.replace('{0}', workKey);
      
      console.log(`Caricamento dettagli libro "${workKey}"`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OpenLibraryService.HTTP_TIMEOUT_SECONDS);

      const httpResponse = await fetch(bookDetailsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Libibi (federico.filice@studenti.unipr.it)',
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        next: { revalidate: 86400 } // Cache per 24 ore
      });

      clearTimeout(timeoutId);

      if (!httpResponse.ok) {
        throw new Error(`HTTP error! status: ${httpResponse.status}`);
      }

      const bookData = await httpResponse.json();

      const bookDescription = this.extractBookDescription(bookData);
      const authorKeysList = this.extractAuthorKeysFromBookDetails(bookData);
      const authorNamesList = await this.getAuthorNamesFromKeys(authorKeysList);
      const bookCoverUrl = this.extractCoverImageFromBookDetails(bookData);

      const bookResult = {
        workKey: this.getCleanWorkKeyFromBookDetails(bookData),
        title: this.getStringProperty(bookData, "title"),
        author: authorNamesList,
        authorKey: authorKeysList,
        firstPublishYear: this.getStringProperty(bookData, "first_publish_date"),
        subject: this.extractSubjectsList(bookData),
        coverUrl: bookCoverUrl,
        numberOfPagesMedian: this.getIntegerProperty(bookData, "number_of_pages_median"),
        description: bookDescription
      };
      
      return bookResult;
    } catch (ex) {
      console.error(`Errore recupero libro '${workKey}': ${ex}`);
      return null;
    }
  }

  public async getAuthorAsync(authorKey: string): Promise<OpenLibraryAuthorResult | null> {
    try {
      // Chiamata API per dettagli autore
      const authorDetailsUrl = OpenLibraryService.AUTHOR_DETAILS_URL.replace('{0}', authorKey);
      
      console.log(`Caricamento dettagli autore "${authorKey}"`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OpenLibraryService.HTTP_TIMEOUT_SECONDS);

      const httpResponse = await fetch(authorDetailsUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Libibi (federico.filice@studenti.unipr.it)',
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        next: { revalidate: 86400 } // Cache per 24 ore
      });

      clearTimeout(timeoutId);

      if (!httpResponse.ok) {
        throw new Error(`HTTP error! status: ${httpResponse.status}`);
      }

      const authorData = await httpResponse.json();

      const authorBiography = this.extractAuthorBiography(authorData);
      const authorImageUrl = this.extractAuthorImageUrl(authorData);

      const authorResult = {
        authorKey: this.getRequiredStringProperty(authorData, "key")?.replace("/authors/", ""),
        name: this.getRequiredStringProperty(authorData, "name"),
        personalName: this.getStringProperty(authorData, "personal_name"),
        birthDate: this.getStringProperty(authorData, "birth_date"),
        topWork: this.getStringProperty(authorData, "top_work"),
        workCount: this.getIntegerProperty(authorData, "work_count"),
        bio: authorBiography,
        imageUrl: authorImageUrl
      };
      
      return authorResult;
    } catch (ex) {
      console.error(`Errore recupero autore '${authorKey}': ${ex}`);
      return null;
    }
  }

  // Recupera il nome dell'autore
  private async getAuthorNamesFromKeys(authorKeys: string[]): Promise<string[]> {
    try {
      if (authorKeys.length === 0) {
        return [];
      }

      // Ottimizzato: batch di richieste di autori
      const authorNamePromises = authorKeys.map(async (authorKey) => {
        const authorDetails = await this.getAuthorAsync(authorKey);
        return authorDetails?.name || "Autore sconosciuto";
      });
      
      // Non aspetta tutte le richieste se alcune falliscono
      const names = await Promise.allSettled(authorNamePromises);
      return names
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<string>).value);
    } catch (ex) {
      console.error(`Errore recupero nomi autori: ${ex}`);
      return [];
    }
  }

  // Helper methods (equivalenti ai JsonHelper del C#)
  private extractAuthorNamesFromDocument(document: any): string[] {
    return document.author_name || [];
  }

  private extractCoverImageUrl(document: any): string | undefined {
    if (document.cover_i) {
      return `https://covers.openlibrary.org/b/id/${document.cover_i}-M.jpg`;
    }
    return undefined;
  }

  private extractAuthorKeysFromDocument(document: any): string[] {
    return (document.author_key || []).map((key: string) => key.replace("/authors/", ""));
  }

  private getBookTitle(document: any): string | undefined {
    return document.title;
  }

  private getBookRating(document: any): number | undefined {
    return document.ratings_average;
  }

  private getCleanWorkKey(document: any): string | undefined {
    return document.key?.replace("/works/", "");
  }

  private extractBookDescription(data: any): string | undefined {
    if (data.description) {
      if (typeof data.description === 'string') {
        return data.description;
      } else if (data.description.value) {
        return data.description.value;
      }
    }
    return undefined;
  }

  private extractAuthorKeysFromBookDetails(data: any): string[] {
    if (data.authors && Array.isArray(data.authors)) {
      return data.authors.map((author: any) => 
        author.author?.key?.replace("/authors/", "") || ""
      ).filter((key: string) => key !== "");
    }
    return [];
  }

  private extractCoverImageFromBookDetails(data: any): string | undefined {
    if (data.covers && Array.isArray(data.covers) && data.covers.length > 0) {
      return `https://covers.openlibrary.org/b/id/${data.covers[0]}-M.jpg`;
    }
    return undefined;
  }

  private getCleanWorkKeyFromBookDetails(data: any): string | undefined {
    return data.key?.replace("/works/", "");
  }

  private extractSubjectsList(data: any): string[] {
    return data.subjects || [];
  }

  private extractAuthorBiography(data: any): string | undefined {
    if (data.bio) {
      if (typeof data.bio === 'string') {
        return data.bio;
      } else if (data.bio.value) {
        return data.bio.value;
      }
    }
    return undefined;
  }

  private extractAuthorImageUrl(data: any): string | undefined {
    if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
      return `https://covers.openlibrary.org/a/id/${data.photos[0]}-M.jpg`;
    }
    return undefined;
  }

  private getStringProperty(data: any, property: string): string | undefined {
    return data[property];
  }

  private getRequiredStringProperty(data: any, property: string): string | undefined {
    return data[property];
  }

  private getIntegerProperty(data: any, property: string): number | undefined {
    const value = data[property];
    return typeof value === 'number' ? value : undefined;
  }
}

// Istanza singleton per l'export
export const openLibraryService = new OpenLibraryService();