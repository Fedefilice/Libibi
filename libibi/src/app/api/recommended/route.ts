import { NextRequest } from 'next/server';
import { requireBasicAuth } from '../../../lib/basicAuth';
import { connectToDatabase, sql } from '../../../../lib/db';
import { parseBookTitles } from '../../../../lib/bookUtils';
import { openLibraryService } from '../../../services/open_library_services';
import { BookSearchResult } from '../../../types/book';

// Tipi per le strutture dati locali
interface UserBook {
  title: string;
  author: string;
  Title?: string;
  AuthorName?: string[];
  Author?: string[];
}

interface CategorizedBooks {
  read: UserBook[];
  reading: UserBook[];
  wantToRead: UserBook[];
  abandoned: UserBook[];
}

interface DatabaseBook {
  title: string;
  authors: string | null;
  status: 'Read' | 'Reading' | 'WantToRead' | 'Abandoned';
  last_updated: Date;
}

interface DatabaseSearchResult {
  authorID: number;
  authorName: string;
  bookID: string;
  title: string;
  coverImageURL: string | null;
  averageRating: number | null;
}

interface LLMResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    console.log('Recommended API called');
    
    // Richiede Basic Auth 
    const auth = await requireBasicAuth(req);
    if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!auth.user) return Response.json({ error: 'User info missing' }, { status: 500 });
    
    const userID: number = auth.user.userID;
    console.log('User ID:', userID);

    // Recupera i libri dell'utente dal database
    const userBooks: CategorizedBooks = await getUserBooksFromDatabase(userID);

    // Prompt
    const readerProfile: string = buildReaderProfile(userBooks);
    console.log('Reader profile:', readerProfile);

    const systemPrompt: string = "Sei un bibliotecario esperto specializzato in raccomandazioni personalizzate.\n"
                        + "Analizza il profilo di lettura dell'utente e i suoi gusti per suggerire libri perfetti per lui.\n\n"
                        + "Considera:\n"
                        + "- I libri che ha apprezzato di più (stelle alte)\n"
                        + "- I generi e autori preferiti\n"
                        + "- I libri abbandonati (da evitare generi/stili simili)\n"
                        + "- Le preferenze che emergono dalle sue letture\n\n"
                        + "Rispondi esclusivamente con un singolo JSON strutturato che contiene tutti e 6 i libri.\n"
                        + "Formato richiesto: {\"raccomandazioni\": [{\"titolo\": \"Nome del libro\", \"autore\": \"Nome dell'autore\"}, {\"titolo\": \"Nome del libro\", \"autore\": \"Nome dell'autore\"}, {\"titolo\": \"Nome del libro\", \"autore\": \"Nome dell'autore\"}, {\"titolo\": \"Nome del libro\", \"autore\": \"Nome dell'autore\"}, {\"titolo\": \"Nome del libro\", \"autore\": \"Nome dell'autore\"}, {\"titolo\": \"Nome del libro\", \"autore\": \"Nome dell'autore\"}]}";

    const userPrompt: string = "Ecco il profilo di lettura dell'utente:\n\n"
                        + readerProfile + "\n\n"
                        + "Basandoti su questi dati, consiglia 6 libri che potrebbero piacergli. Rispondi solo con il JSON richiesto.";

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-72b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      throw new Error("OpenRouter API error: " + res.status);
    }

    const data: LLMResponse = await res.json();
    const text: string = data.choices?.[0]?.message?.content || "Nessuna raccomandazione trovata.";
    
    // Parsa la risposta dell'LLM per estrarre la lista di titoli
    const recommendedTitles: string[] = parseBookTitles(text);
    console.log('LLM response text:', text);
    console.log('Parsed titles:', recommendedTitles);
    
    // Cerca ogni libro raccomandato nel database e su OpenLibrary
    const bookResults: BookSearchResult[] = [];
    
    for (const title of recommendedTitles) {
      try {
        // Cerca direttamente nel database e OpenLibrary
        const searchResults: BookSearchResult[] = await searchBooksInDatabase(title);
        
        // Se trovato, prendi il primo risultato
        if (Array.isArray(searchResults) && searchResults.length > 0) {
          bookResults.push({
            ...searchResults[0],
            isExternal: true
          });
        } else {
          // Se non trovato, crea un oggetto con dati minimi
          bookResults.push({
            Title: title,
            AuthorName: ["Autore da cercare"],
            CoverUrl: "/book-image.jpg",
            Rating: null,
            AuthorKey: [],
            WorkKey: `search:${encodeURIComponent(title)}`,
            isExternal: true
          });
        }
      } catch (error) {
        console.error(`Errore nella ricerca del libro "${title}":`, error);
        // In caso di errore, crea oggetto con dati minimi
        bookResults.push({
          Title: title,
          AuthorName: ["Errore nella ricerca"],
          CoverUrl: "/book-image.jpg",
          Rating: null,
          AuthorKey: [],
          WorkKey: `search:${encodeURIComponent(title)}`,
          isExternal: true
        });
      }
    }
    
    return Response.json(bookResults);

  } catch (error: any) {
    console.error('Errore API raccomandazioni:', error);
    return Response.json({ 
      error: "Errore interno del server",
      details: error.message 
    }, { status: 500 });
  }
}

// Normalizza un libro e lo formatta per il profilo del lettore
function normalizeBook(book: UserBook): string {
  const title: string = book.title || book.Title || "Titolo sconosciuto";
  const author: string = book.author || 
                        (book.AuthorName ? book.AuthorName.join(", ") : null) || 
                        (book.Author ? book.Author.join(", ") : null) || 
                        "Autore sconosciuto";
  
  return `- "${title}" di ${author}`;
}

// Costruisce il profilo del lettore basato sui libri categorizzati
function buildReaderProfile(userBooks: CategorizedBooks): string {
  const profile: string[] = [];

  // Libri letti 
  if (userBooks.read?.length > 0) {
    profile.push("LIBRI LETTI:");
    userBooks.read.forEach(book => {
      profile.push(normalizeBook(book));
    });
    profile.push(""); // riga vuota
  }

  // Sto leggendo
  if (userBooks.reading?.length > 0) {
    profile.push("STO LEGGENDO:");
    userBooks.reading.forEach(book => {
      profile.push(normalizeBook(book));
    });
    profile.push("");
  }

  // Voglio leggere
  if (userBooks.wantToRead?.length > 0) {
    profile.push("VOGLIO LEGGERE:");
    userBooks.wantToRead.forEach(book => {
      profile.push(normalizeBook(book));
    });
    profile.push("");
  }

  // Libri abbandonati (da considerare per evitare raccomandazioni simili)
  if (userBooks.abandoned?.length > 0) {
    profile.push("LIBRI ABBANDONATI (da evitare simili):");
    userBooks.abandoned.forEach(book => {
      profile.push(normalizeBook(book));
    });
    profile.push("");
  }

  return profile.join("\n");
}

// Recupera i libri dell'utente dal database organizzati per categoria
async function getUserBooksFromDatabase(userID: number): Promise<CategorizedBooks> {
  try {
    const pool = await connectToDatabase();
    const request = pool.request();
    request.input('UserID', sql.Int, userID);
    
    const query: string = `
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
    
    // Organizza i libri per categoria
    const categorizedBooks: CategorizedBooks = {
      read: [],
      reading: [],
      wantToRead: [],
      abandoned: []
    };
    
    result.recordset.forEach((book: DatabaseBook) => {
      const bookData: UserBook = {
        title: book.title,
        author: book.authors || "Autore sconosciuto"
      };
      
      // Mappa gli status del database alle categorie richieste
      // Basato sulla mappatura in /users/shelves: WantToRead, Reading, Read, Abandoned
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
          // Se non riconosciuto, metti in "want to read" come default
          categorizedBooks.wantToRead.push(bookData);
      }
    });
    
    return categorizedBooks;
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

// Funzione helper per cercare libri nel database e OpenLibrary
async function searchBooksInDatabase(query: string): Promise<BookSearchResult[]> {
  try {
    // Connessione al database
    const pool = await connectToDatabase();
    
    // Cerca prima i libri nel database locale
    const result = await pool.request()
      .input('term', sql.NVarChar, `%${query}%`)
      .query<DatabaseSearchResult>(`
        SELECT a.authorID, a.authorName, b.bookID, b.title, b.coverImageURL, b.averageRating
        FROM Books b
        LEFT JOIN Book_Authors ba ON b.bookID = ba.bookID
        LEFT JOIN Authors a ON ba.authorID = a.authorID
        WHERE b.title LIKE @term OR a.authorName LIKE @term OR b.subjectsJson LIKE @term
      `);
    
    // Trasforma i risultati nel formato desiderato
    const localResults: BookSearchResult[] = [];
    
    // Raggruppiamo i risultati per bookID per gestire libri con più autori
    const booksMap = new Map<string, BookSearchResult>();
    
    for (const row of result.recordset) {
      const bookID: string = row.bookID;
      
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
        // Aggiungi autori aggiuntivi per lo stesso libro
        const book = booksMap.get(bookID)!;
        if (row.authorName && !book.AuthorName.includes(row.authorName)) {
          book.AuthorName.push(row.authorName);
        }
        if (row.authorID && !book.AuthorKey.includes(row.authorID.toString())) {
          book.AuthorKey.push(row.authorID.toString());
        }
      }
    }
    
    // Converti la mappa in array di risultati
    for (const book of booksMap.values()) {
      localResults.push(book);
    }
    
    // Se abbiamo risultati locali, restituiscili
    if (localResults.length > 0) {
      return localResults;
    }
    
    // Altrimenti cerca su OpenLibrary
    const books = await openLibraryService.getListBookAsync(query);
    return books.map(book => ({
      Title: book.title || "Titolo sconosciuto",
      AuthorName: book.author || [],
      CoverUrl: book.coverUrl || null,
      Rating: book.rating || null,
      AuthorKey: book.authorKey || [],
      WorkKey: book.workKey || ""
    }));
  } catch (error) {
    console.error('Errore durante la ricerca:', error);
    return [];
  }
}