import { connectToDatabase, sql } from '../../lib/db';
import { openLibraryService } from './open_library_services';
import { BookSearchResult } from '../types/book';
import { 
  CategorizedBooks, 
  UserBook, 
  DatabaseBook, 
  DatabaseSearchResult 
} from '../types/recommendations';

export class UserBookService {
  /**
   * Recupera i libri dell'utente dal database organizzati per categoria
   */
  async getUserBooks(userID: number): Promise<CategorizedBooks> {
    try {
      const pool = await connectToDatabase();
      const request = pool.request();
      request.input('UserID', sql.Int, userID);
      
      const query = `
        SELECT 
          b.title,
          STRING_AGG(a.authorName, ', ') as authors,
          us.status,
          MAX(us.last_updated) as last_updated
        FROM User_Shelves us
        INNER JOIN Books b ON us.bookID = b.bookID
        LEFT JOIN Book_Authors ba ON b.bookID = ba.bookID
        LEFT JOIN Authors a ON ba.authorID = a.authorID
        WHERE us.userID = @UserID
        GROUP BY b.title, us.status
        ORDER BY MAX(us.last_updated) DESC
      `;
      
      const result = await request.query<DatabaseBook>(query);
      
      return this.categorizeBooks(result.recordset);
    } catch (error) {
      console.error('Errore nel recupero libri utente:', error);
      return {
        read: [],
        reading: [],
        wantToRead: [],
        abandoned: []
      };
    }
  }

  /**
   * Cerca libri nel database e su OpenLibrary
   */
  async searchBooks(query: string): Promise<BookSearchResult[]> {
    try {
      // Cerca prima nel database locale
      const localResults = await this.searchBooksInDatabase(query);
      
      if (localResults.length > 0) {
        return localResults;
      }
      
      // Altrimenti cerca su OpenLibrary
      const openLibraryBooks = await openLibraryService.getListBookAsync(query);
      return this.formatOpenLibraryResults(openLibraryBooks);
    } catch (error) {
      console.error('Errore durante la ricerca:', error);
      return [];
    }
  }

  /**
   * Organizza i libri per categoria in base allo status
   */
  private categorizeBooks(books: DatabaseBook[]): CategorizedBooks {
    const categorizedBooks: CategorizedBooks = {
      read: [],
      reading: [],
      wantToRead: [],
      abandoned: []
    };
    
    books.forEach((book: DatabaseBook) => {
      const bookData: UserBook = {
        Title: book.title,
        AuthorName: book.authors ? [book.authors] : ["Autore sconosciuto"],
        AuthorKey: [],
        WorkKey: ""
      };
      
      switch (book.status) {
        case 'Read':
          categorizedBooks.read.push(bookData);
          break;
        case 'Reading':
          categorizedBooks.reading.push(bookData);
          break;
        case 'WantToRead':
          categorizedBooks.wantToRead.push(bookData);
          break;
        case 'Abandoned':
          categorizedBooks.abandoned.push(bookData);
          break;
        default:
          categorizedBooks.wantToRead.push(bookData);
      }
    });
    
    return categorizedBooks;
  }

  /**
   * Cerca libri nel database locale
   */
  private async searchBooksInDatabase(query: string): Promise<BookSearchResult[]> {
    const pool = await connectToDatabase();
    
    const result = await pool.request()
      .input('term', sql.NVarChar, `%${query}%`)
      .query<DatabaseSearchResult>(`
        SELECT a.authorID, a.authorName, b.bookID, b.title, b.coverImageURL, b.averageRating
        FROM Books b
        LEFT JOIN Book_Authors ba ON b.bookID = ba.bookID
        LEFT JOIN Authors a ON ba.authorID = a.authorID
        WHERE b.title LIKE @term OR a.authorName LIKE @term OR b.subjectsJson LIKE @term
      `);
    
    return this.formatDatabaseResults(result.recordset);
  }

  /**
   * Formatta i risultati del database
   */
  private formatDatabaseResults(records: DatabaseSearchResult[]): BookSearchResult[] {
    const booksMap = new Map<string, BookSearchResult>();
    
    for (const row of records) {
      const bookID = row.bookID;
      
      if (!booksMap.has(bookID)) {
        booksMap.set(bookID, {
          Title: row.title,
          AuthorName: row.authorName ? [row.authorName] : [],
          CoverUrl: row.coverImageURL || null,
          Rating: row.averageRating || null,
          AuthorKey: row.authorID ? [row.authorID.toString()] : [],
          WorkKey: bookID
        });
      } else {
        const book = booksMap.get(bookID)!;
        if (row.authorName && !book.AuthorName.includes(row.authorName)) {
          book.AuthorName.push(row.authorName);
        }
        if (row.authorID && !book.AuthorKey.includes(row.authorID.toString())) {
          book.AuthorKey.push(row.authorID.toString());
        }
      }
    }
    
    return Array.from(booksMap.values());
  }

  /**
   * Formatta i risultati di OpenLibrary
   */
  private formatOpenLibraryResults(books: any[]): BookSearchResult[] {
    return books.map(book => ({
      Title: book.title || "Titolo sconosciuto",
      AuthorName: book.author || [],
      CoverUrl: book.coverUrl || null,
      Rating: book.rating || null,
      AuthorKey: book.authorKey || [],
      WorkKey: book.workKey || ""
    }));
  }
}

export const userBookService = new UserBookService();