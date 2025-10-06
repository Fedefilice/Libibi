import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connectToDatabase, sql } from '../../../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const pool = await connectToDatabase();
    const request = pool.request();
    const result = await request.query(`
      SELECT r.reviewID, r.bookID, b.title as bookTitle, r.userID, u.username as username, r.parentReviewID, r.rating, r.reviewTitle, r.reviewText, r.reviewDate
      FROM Reviews r
      LEFT JOIN Users u ON u.userID = r.userID
      LEFT JOIN Books b ON b.bookID = r.bookID
      WHERE r.is_deleted = 0
      ORDER BY r.reviewDate DESC
    `);
    return NextResponse.json(result.recordset);
  } catch (ex: any) {
    console.error('GetAllReviews error', ex?.message ?? ex);
    return NextResponse.json({ Errore: ex?.message ?? String(ex) }, { status: 500 });
  }
}
