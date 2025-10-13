import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireBasicAuth } from '../../../services/basicAuth';
import { connectToDatabase, sql } from '../../../../lib/db';
import { ReviewInput } from '@/types/review';

// POST: aggiunge una recensione (richiede Basic Auth)
export async function POST(req: NextRequest) {
  const auth = await requireBasicAuth(req);
  if (!auth) return NextResponse.json({ Errore: 'Unauthorized' }, { status: 401 });

  let body: ReviewInput;
  try {
    body = await req.json();
  } catch (ex: any) {
    return NextResponse.json({ Errore: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || !body.bookID || typeof body.rating !== 'number') {
    return NextResponse.json({ Errore: 'Missing required fields (bookID, rating)' }, { status: 400 });
  }

  // controlla parent review se presente
  try {
    const pool = await connectToDatabase();

    if (body.parentReviewID) {
      const requestCheck = pool.request();
      requestCheck.input('parent', sql.UniqueIdentifier, body.parentReviewID);
      const resCheck = await requestCheck.query('SELECT COUNT(*) as cnt FROM Reviews WHERE reviewID = @parent');
      const cnt = resCheck.recordset[0]?.cnt ?? 0;
      if (cnt === 0) {
        return NextResponse.json({ Errore: "La recensione padre specificata non esiste." }, { status: 400 });
      }
    }

    // auth.user contiene i dettagli dell'utente (vedi basicAuth.requireBasicAuth)
    const user = auth.user;
    if (!user || !user.userID) return NextResponse.json({ Errore: 'Forbidden' }, { status: 403 });

    const request = pool.request();
    request.input('bookID', sql.NVarChar(64), body.bookID);
    request.input('userID', sql.Int, user.userID);
    // Verifica se lo stesso utente ha già scritto una recensione per questo libro
    const dupCheck = pool.request();
    dupCheck.input('bookID', sql.NVarChar(64), body.bookID);
    dupCheck.input('userID', sql.Int, user.userID);
    const dupRes = await dupCheck.query(`SELECT COUNT(*) as cnt FROM Reviews WHERE bookID = @bookID AND userID = @userID AND is_deleted = 0`);
    const already = dupRes.recordset[0]?.cnt ?? 0;
    if (already > 0) {
      return NextResponse.json({ Errore: 'Hai già inserito una recensione per questo libro.' }, { status: 409 });
    }
    if (body.parentReviewID) request.input('parentReviewID', sql.UniqueIdentifier, body.parentReviewID);
    else request.input('parentReviewID', sql.UniqueIdentifier, null);
    request.input('rating', sql.Int, body.rating);
    request.input('reviewTitle', sql.NVarChar(255), body.reviewTitle ?? null);
    request.input('reviewText', sql.NText, body.reviewText ?? null);

    // Inserisce la recensione con nuova reviewID e reviewDate UTC
    const insertSql = `
      INSERT INTO Reviews (reviewID, bookID, userID, parentReviewID, rating, reviewTitle, reviewText, reviewDate, is_deleted)
      VALUES (NEWID(), @bookID, @userID, @parentReviewID, @rating, @reviewTitle, @reviewText, GETUTCDATE(), 0)
    `;

    await request.query(insertSql);
    return NextResponse.json({ Messaggio: 'Recensione inserita con successo' });
  } catch (ex: any) {
    console.error('PostReview error', ex?.message ?? ex);
    return NextResponse.json({ Errore: ex?.message ?? String(ex) }, { status: 500 });
  }
}

// GET: restituisce recensioni per uno specifico libro: /api/review?bookId=xxx
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const bookId = url.searchParams.get('bookId');
  const pathname = url.pathname || '';

  try {
    const pool = await connectToDatabase();

    // Se viene richiesta la lista completa /api/review/all oppure non è passato bookId
    if (pathname.endsWith('/all') || !bookId) {
      const request = pool.request();
      // JOIN con Users e Books per mostrare username e titolo
      const result = await request.query(`
        SELECT r.reviewID, r.bookID, b.title as bookTitle, r.userID, u.username as username, r.parentReviewID, r.rating, r.reviewTitle, r.reviewText, r.reviewDate
        FROM Reviews r
        LEFT JOIN Users u ON u.userID = r.userID
        LEFT JOIN Books b ON b.bookID = r.bookID
        WHERE r.is_deleted = 0
        ORDER BY r.reviewDate DESC
      `);
      return NextResponse.json(result.recordset);
    }

    // Altrimenti ritorna le recensioni per un singolo libro
    const request = pool.request();
    request.input('bookID', sql.NVarChar(64), bookId);
    const result = await request.query(`
      SELECT r.reviewID, r.bookID, r.userID, u.username as username, r.parentReviewID, r.rating, r.reviewTitle, r.reviewText, r.reviewDate
      FROM Reviews r
      LEFT JOIN Users u ON u.userID = r.userID
      WHERE r.bookID = @bookID AND r.is_deleted = 0
      ORDER BY r.reviewDate DESC
    `);
    return NextResponse.json(result.recordset);
  } catch (ex: any) {
    console.error('GetReviews error', ex?.message ?? ex);
    return NextResponse.json({ Errore: ex?.message ?? String(ex) }, { status: 500 });
  }
}
