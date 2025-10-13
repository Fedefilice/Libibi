import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireBasicAuth } from '../../../../services/basicAuth';
import { connectToDatabase, sql } from '../../../../../lib/db';

// GET: ottiene le recensioni scritte dall'utente autenticato (richiede Basic Auth)

export async function GET(req: NextRequest) {
  const auth = await requireBasicAuth(req);
  if (!auth) return NextResponse.json({ Errore: 'Unauthorized' }, { status: 401 });

  try {
    const user = auth.user;
    if (!user || !user.userID) return NextResponse.json({ Errore: 'Forbidden' }, { status: 403 });

    const pool = await connectToDatabase();
    const request = pool.request();
    request.input('userID', sql.Int, user.userID);
    const result = await request.query(`
      SELECT r.reviewID, r.bookID, b.title as bookTitle, r.userID, u.username as username, r.parentReviewID, r.rating, r.reviewTitle, r.reviewText, r.reviewDate
      FROM Reviews r
      LEFT JOIN Users u ON u.userID = r.userID
      LEFT JOIN Books b ON b.bookID = r.bookID
      WHERE r.is_deleted = 0 AND r.userID = @userID
      ORDER BY r.reviewDate DESC
    `);
    return NextResponse.json(result.recordset);
  } catch (ex: any) {
    console.error('GetUserReviews error', ex?.message ?? ex);
    return NextResponse.json({ Errore: ex?.message ?? String(ex) }, { status: 500 });
  }
}
