import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, sql } from '../../../../lib/db';
import { openLibraryService } from '../../../services/open_library_services';

/**
 * Endpoint API per la ricerca di libri sia nel database locale che su OpenLibrary
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('termineRicerca') || '';
  
  if (!query) {
    return NextResponse.json(
      { errore: 'Termine di ricerca non valido' },
      { status: 400 }
    );
  }

  try {
    // Connessione al database
    const pool = await connectToDatabase();
    
    // Cerca prima i libri nel database locale
    const result = await pool.request()
      .input('term', sql.NVarChar, `%${query}%`)
      .query(`
        SELECT a.authorID, a.authorName, b.bookID, b.title, b.coverImageURL, b.averageRating
        FROM Books b
        LEFT JOIN Book_Authors ba ON b.bookID = ba.bookID
        LEFT JOIN Authors a ON ba.authorID = a.authorID
        WHERE b.title LIKE @term OR a.authorName LIKE @term OR b.subjectsJson LIKE @term
      `);
    
    // Trasforma i risultati nel formato desiderato
    const localResults: any[] = [];
    
    // Raggruppiamo i risultati per bookID per gestire libri con più autori
    const booksMap = new Map<string, any>();
    
    for (const row of result.recordset) {
      const bookID = row.bookID;
      
      if (!booksMap.has(bookID)) {
        booksMap.set(bookID, {
          Title: row.title,
          AuthorName: row.authorName ? [row.authorName] : [],
          CoverUrl: row.coverImageURL || null,
          Rating: row.averageRating || null,
          AuthorKey: row.authorID ? [row.authorID] : [],
          WorkKey: bookID
        });
      } else {
        // Aggiungi autori aggiuntivi per lo stesso libro
        const book = booksMap.get(bookID);
        if (row.authorName && !book.AuthorName.includes(row.authorName)) {
          book.AuthorName.push(row.authorName);
        }
        if (row.authorID && !book.AuthorKey.includes(row.authorID)) {
          book.AuthorKey.push(row.authorID);
        }
      }
    }
    
    // Converti la mappa in array di risultati
    for (const book of booksMap.values()) {
      localResults.push(book);
    }
    
    // Se abbiamo risultati locali, restituiscili
    if (localResults.length > 0) {
      return NextResponse.json(localResults);
    }
    
    // Altrimenti cerca su OpenLibrary
    const externalResults = await searchOpenLibrary(query);
    if (externalResults.length === 0) {
      return NextResponse.json({ Messaggio: "non sono stati trovati risultati corrispondenti alla richiesta" });
    }
    
    return NextResponse.json(externalResults);
  } catch (error) {
    console.error('Errore durante la ricerca:', error);
    return NextResponse.json(
      { errore: error instanceof Error ? error.toString() : 'Errore sconosciuto' },
      { status: 400 }
    );
  }
}

/**
 * Helper per la ricerca su OpenLibrary
 */
async function searchOpenLibrary(query: string): Promise<any[]> {
  try {
    const books = await openLibraryService.getListBookAsync(query);
    return books.map(book => ({
      Title: book.title,
      AuthorName: book.author || [],
      CoverUrl: book.coverUrl,
      Rating: book.rating,
      AuthorKey: book.authorKey || [],
      WorkKey: book.workKey
    }));
  } catch (error) {
    console.error('Errore durante la ricerca su OpenLibrary:', error);
    return [];
  }
}
