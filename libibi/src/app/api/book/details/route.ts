import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, sql } from '../../../../../lib/db';
import { openLibraryService } from '../../../../services/open_library_services';
import { BookDetail, ApiResponse } from '@/types/book';

/**
 * Trasforma i dati del database in formato di risposta
 */
function transformDbToResponse(dbRows: any[]): BookDetail {
  const firstRow = dbRows[0];
  
  const authors: string[] = [];
  const authorKeys: string[] = [];
  
  // Raccoglie tutti gli autori associati al libro
  for (const row of dbRows) {
    if (row.authorName && !authors.includes(row.authorName)) {
      authors.push(row.authorName);
    }
    if (row.authorID && !authorKeys.includes(row.authorID)) {
      authorKeys.push(row.authorID);
    }
  }
  
  // Deserializza il JSON dei soggetti
  let subjects: string[] = [];
  try {
    if (firstRow.subjectsJson) {
      subjects = JSON.parse(firstRow.subjectsJson);
    }
  } catch (error) {
    console.error('Errore nel parsing dei soggetti:', error);
  }
  
  return {
    WorkKey: firstRow.bookID,
    Title: firstRow.title,
    FirstPublishYear: firstRow.firstPublicationYear,
    NumberOfPagesMedian: firstRow.pageNumber,
    Rating: firstRow.averageRating,
    Description: firstRow.bookDescription,
    Subject: subjects,
    CoverUrl: firstRow.coverImageURL,
    Author: authors,
    AuthorKey: authorKeys
  };
}

/**
 * Trasforma i dati di Open Library per l'inserimento nel database
 */
function transformOpenLibraryToDb(bookDetail: any) {
  return {
    id: bookDetail.workKey,
    title: bookDetail.title || 'Titolo sconosciuto',
    firstYear: bookDetail.firstPublishYear,
    pages: bookDetail.numberOfPagesMedian,
    description: bookDetail.description,
    subjects: bookDetail.subject ? JSON.stringify(bookDetail.subject) : null,
    coverUrl: bookDetail.coverUrl
  };
}

/**
 * Trasforma i dati di Open Library in formato di risposta
 */
function transformOpenLibraryToResponse(bookDetail: any): BookDetail {
  return {
    WorkKey: bookDetail.workKey || '',
    Title: bookDetail.title || '',
    FirstPublishYear: bookDetail.firstPublishYear || null,
    NumberOfPagesMedian: bookDetail.numberOfPagesMedian || null,
    Rating: null,
    Description: bookDetail.description || null,
    Subject: bookDetail.subject || [],
    CoverUrl: bookDetail.coverUrl || null,
    Author: bookDetail.author || [],
    AuthorKey: bookDetail.authorKey || []
  };
}

/**
 * Endpoint API per ottenere i dettagli di un libro
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bookId = searchParams.get('bookId') || '';
  
  if (!bookId) {
    return NextResponse.json(
      { errore: 'bookId non valido' },
      { status: 400 }
    );
  }

  try {
    // Connessione al database
    const pool = await connectToDatabase();
    
    // Cerca prima il libro nel database locale
    const result = await pool.request()
      .input('bookId', sql.NVarChar, bookId)
      .query(`
        SELECT b.bookID, b.title, b.firstPublicationYear, b.pageNumber, b.averageRating, 
               b.bookDescription, b.subjectsJson, b.coverImageURL,
               a.authorID, a.authorName
        FROM Books b
        LEFT JOIN Book_Authors ba ON b.bookID = ba.bookID
        LEFT JOIN Authors a ON ba.authorID = a.authorID
        WHERE b.bookID = @bookId
      `);
    
    if (result.recordset.length > 0) {
      const responseData = transformDbToResponse(result.recordset);
      
      return NextResponse.json({ 
        success: true, 
        result: responseData 
      });
    }
    
    // Se non trovato nel DB, cerca su OpenLibrary
    const bookDetail = await openLibraryService.getBookAsync(bookId);
    
    if (!bookDetail) {
      return NextResponse.json(
        { Messaggio: 'Libro non trovato' },
        { status: 404 }
      );
    }
    
    // Preparazione dati per inserimento nel DB
    try {
      const bookForDB = transformOpenLibraryToDb(bookDetail);

      // Inserisci il libro nel database
      await pool.request()
        .input('id', sql.NVarChar, bookForDB.id)
        .input('title', sql.NVarChar, bookForDB.title)
        .input('firstYear', sql.NVarChar, bookForDB.firstYear || null)
        .input('pages', sql.Int, bookForDB.pages || null)
        .input('rating', sql.Float, null)
        .input('description', sql.NVarChar, bookForDB.description || null)
        .input('subjects', sql.NVarChar, bookForDB.subjects || null)
        .input('coverUrl', sql.NVarChar, bookForDB.coverUrl || null)
        .query(`
          INSERT INTO Books (bookID, title, firstPublicationYear, pageNumber, averageRating, 
                           bookDescription, subjectsJson, coverImageURL)
          VALUES (@id, @title, @firstYear, @pages, @rating, @description, @subjects, @coverUrl)
        `);

      // Gestione delle relazioni autori-libri
      const authorKeys = bookDetail.authorKey || [];
      for (const authorKey of authorKeys) {
        if (!authorKey) continue;
        
        // Verifica/inserisci autore se non presente
        await isAuthorInDb(authorKey);
        
        // Crea relazione libro-autore
        await pool.request()
          .input('bookId', sql.NVarChar, bookDetail.workKey)
          .input('authorId', sql.NVarChar, authorKey)
          .query(`INSERT INTO Book_Authors (bookID, authorID) VALUES (@bookId, @authorId)`);
      }
    } catch (error) {
      console.error('Errore durante l\'inserimento del libro nel database:', error);
      // Continuiamo comunque per restituire i dati all'utente
    }
    
    const response = transformOpenLibraryToResponse(bookDetail);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Errore durante il recupero dei dettagli del libro:', error);
    return NextResponse.json(
      { errore: error instanceof Error ? error.toString() : 'Errore sconosciuto' },
      { status: 400 }
    );
  }
}

/**
 * Helper per verificare/inserire un autore nel database
 */
async function isAuthorInDb(authorKey: string) {
  if (!authorKey) return;
  
  try {
    const pool = await connectToDatabase();
    
    // Verifica se l'autore esiste già
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, authorKey)
      .query('SELECT COUNT(*) AS count FROM Authors WHERE authorID = @id');
    
    if (checkResult.recordset[0].count > 0) {
      return; // Autore già presente
    }
    
    // Recupera dettagli autore da OpenLibrary
    const authorDetail = await openLibraryService.getAuthorAsync(authorKey);
    if (!authorDetail) return;
    
    // Inserisci l'autore nel database
    await pool.request()
      .input('id', sql.NVarChar, authorKey)
      .input('name', sql.NVarChar, authorDetail.name || 'Nome sconosciuto')
      .input('personalName', sql.NVarChar, authorDetail.personalName || null)
      .input('birthDate', sql.NVarChar, authorDetail.birthDate || null)
      .input('topWork', sql.NVarChar, authorDetail.topWork || null)
      .input('workCount', sql.Int, authorDetail.workCount || null)
      .input('bio', sql.NVarChar, authorDetail.bio || null)
      .input('imageUrl', sql.NVarChar, authorDetail.imageUrl || null)
      .query(`
        INSERT INTO Authors (authorID, authorName, birthName, birthDate, mostFamousWork, totalWorks, biography, imageUrl)
        VALUES (@id, @name, @personalName, @birthDate, @topWork, @workCount, @bio, @imageUrl)
      `);
      
  } catch (error) {
    console.error('Errore durante la gestione dell\'autore:', error);
    throw error;
  }
}