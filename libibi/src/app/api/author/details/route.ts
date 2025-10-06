import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, sql } from '../../../../../lib/db';
import { openLibraryService } from '../../../../services/open_library_services';

/**
 * Endpoint API per ottenere i dettagli di un autore
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const authorId = searchParams.get('authorId') || searchParams.get('authorKey') || '';
  
  if (!authorId) {
    return NextResponse.json(
      { errore: 'authorId o authorKey non valido' },
      { status: 400 }
    );
  }

  try {
    // Connessione al database
    const pool = await connectToDatabase();
    
    // Prima verifica/inserisci l'autore se non presente
    await isAuthorInDb(authorId);
    
    // Poi cerca l'autore nel database locale
    const result = await pool.request()
      .input('id', sql.NVarChar, authorId)
      .query(`
        SELECT authorID, authorName, birthName, birthDate, mostFamousWork, 
               totalWorks, biography, imageUrl
        FROM Authors 
        WHERE authorID = @id
      `);
    
    if (result.recordset.length > 0) {
      const authorData = result.recordset[0];
      
      return NextResponse.json({
        AuthorKey: authorData.authorID,
        Name: authorData.authorName,
        PersonalName: authorData.birthName,
        BirthDate: authorData.birthDate,
        TopWork: authorData.mostFamousWork,
        WorkCount: authorData.totalWorks,
        Bio: authorData.biography,
        ImageUrl: authorData.imageUrl
      });
    }
    
    return NextResponse.json(
      { Messaggio: 'Autore non trovato' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Errore durante il recupero dei dettagli dell\'autore:', error);
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