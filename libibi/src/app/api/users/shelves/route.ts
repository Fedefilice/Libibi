import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireBasicAuth } from '../../../../lib/basicAuth';
import { connectToDatabase, sql } from '../../../../../lib/db';

export async function POST(req: NextRequest) {
  // Richiede Basic Auth
  const auth = await requireBasicAuth(req);
  if (!auth) return NextResponse.json({ Errore: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const bookID = (body.bookID ?? '') as string;
  const status = (body.status ?? 'want_to_read') as string;
    let started = body.started_reading_date ? new Date(body.started_reading_date) : null;
  let finished = body.finished_reading_date ? new Date(body.finished_reading_date) : null;
    if (!bookID) return NextResponse.json({ Errore: 'Missing bookID' }, { status: 400 });

    if (!auth.user) return NextResponse.json({ Errore: 'User info missing' }, { status: 500 });
    const userID = auth.user.userID;

    // Mappatura status per corrispondere ai valori CHECK del DB
    // Il DB si aspetta: WantToRead, Reading, Read, Abandoned
    const STATUS_MAP: Record<string, string> = {
      // italian labels -> DB values
      'Voglio leggerlo': 'WantToRead',
      'Sto leggendo': 'Reading',
      'Letto': 'Read',
      'Abbandonato': 'Abandoned',
      // english-friendly -> DB values
      'want_to_read': 'WantToRead',
      'reading': 'Reading',
      'finished': 'Read',
      'abandoned': 'Abandoned',
      // uppercase variants
      'WANT_TO_READ': 'WantToRead',
      'READING': 'Reading',
      'FINISHED': 'Read',
      'ABANDONED': 'Abandoned',
      // DB values passthrough
      'WantToRead': 'WantToRead',
      'Reading': 'Reading',
      'Read': 'Read',
      'Abandoned': 'Abandoned'
    };
    const rawStatus = (status ?? '').toString();
    const normalizedStatus = STATUS_MAP[rawStatus] ?? rawStatus.trim();
    const allowed = ['WantToRead', 'Reading', 'Read', 'Abandoned'];
    if (!allowed.includes(normalizedStatus)) {
      return NextResponse.json({ Errore: `Invalid status '${rawStatus}'. Allowed values: ${allowed.join(', ')}` }, { status: 400 });
    }

    // Inserisce automaticamente le date se non fornite dal client:
    // normalizedStatus è già mappato ai valori del DB: 'WantToRead' | 'Reading' | 'Read' | 'Abandoned'
    const now = new Date();
    if (normalizedStatus === 'Reading' && !started) {
      started = now;
    }
    if (normalizedStatus === 'Read') {
      if (!started) started = now;
      if (!finished) finished = now;
    }

    const pool = await connectToDatabase();
    const request = pool.request();
  request.input('userID', sql.Int, userID);
  request.input('bookID', sql.NVarChar(64), bookID);
  request.input('status', sql.NVarChar(20), normalizedStatus);

  // Aggiorna se esiste, altrimenti inserisce
  const updateSql = `UPDATE User_Shelves SET status=@status, started_reading_date=@started, finished_reading_date=@finished, last_updated=GETDATE() WHERE userID=@userID AND bookID=@bookID`;
  if (started) request.input('started', sql.Date, started);
  else request.input('started', sql.Date, null);
  if (finished) request.input('finished', sql.Date, finished);
  else request.input('finished', sql.Date, null);
  const updateRes = await request.query(updateSql);
    if (updateRes.rowsAffected && updateRes.rowsAffected[0] > 0) {
      console.log(`User_Shelves: updated for user=${userID} book=${bookID} status=${normalizedStatus}`);
      return NextResponse.json({ Result: 'Updated' });
    }

    // Inserisce nuovo record 
    const insertRequest = pool.request();
  insertRequest.input('userID', sql.Int, userID);
  insertRequest.input('bookID', sql.NVarChar(64), bookID);
  const insertSql = `INSERT INTO User_Shelves (userID, bookID, status, started_reading_date, finished_reading_date, last_updated) VALUES (@userID, @bookID, @status, @started, @finished, GETDATE())`;
  if (started) insertRequest.input('started', sql.Date, started);
  else insertRequest.input('started', sql.Date, null);
  if (finished) insertRequest.input('finished', sql.Date, finished);
  else insertRequest.input('finished', sql.Date, null);
    insertRequest.input('status', sql.NVarChar(20), normalizedStatus);
    try {
      await insertRequest.query(insertSql);
      console.log(`User_Shelves: inserted for user=${userID} book=${bookID} status=${normalizedStatus}`);
    } catch (err: any) {
      // SQLServer da errore 2627 o 2601 in caso di violazione di vincolo di unicità
      const msg = err?.message ?? String(err);
      if (msg.includes('2627') || msg.includes('2601') || /unique/i.test(msg) || /UNIQUE KEY/i.test(msg)) {
        const advice = `It looks like the database has a UNIQUE constraint on the 'status' column which prevents inserting the same status. ` +
          `This is likely a schema mistake. To fix it you can drop the unique constraint on User_Shelves.status. Example SQL (adjust the constraint name):\n` +
          `-- identify constraint name\n` +
          `SELECT name FROM sys.objects WHERE type_desc LIKE '%CONSTRAINT' AND name LIKE '%User_Shelves%';\n` +
          `-- drop constraint (example)\n` +
          `ALTER TABLE dbo.User_Shelves DROP CONSTRAINT <constraint_name>;`;
        console.error('Unique constraint error inserting User_Shelves', err);
        return NextResponse.json({ Errore: 'Unique constraint on status prevented insert', Dettaglio: msg, Fix: advice }, { status: 500 });
      }
      throw err;
    }

    return NextResponse.json({ Result: 'Inserted' });
  } catch (ex: any) {
    console.error('Shelves POST error', ex);
    return NextResponse.json({ Errore: ex?.message ?? String(ex) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireBasicAuth(req);
  if (!auth) return NextResponse.json({ Errore: 'Unauthorized' }, { status: 401 });
  if (!auth.user) return NextResponse.json({ Errore: 'User info missing' }, { status: 500 });
  const userID = auth.user.userID;

  try {
    const pool = await connectToDatabase();
    const request = pool.request();
    request.input('userID', sql.Int, userID);
    // Permette di filtrare per bookID opzionale via query string
    const url = new URL(req.url);
    const bookIDFilter = url.searchParams.get('bookID') || null;
    // Join con Books per restituire alcuni metadati del libro se disponibili
    const sqlText = bookIDFilter
      ? `SELECT us.userID, us.bookID, us.status, us.started_reading_date, us.finished_reading_date, us.last_updated, b.title, b.coverImageURL FROM User_Shelves us LEFT JOIN Books b ON us.bookID = b.bookID WHERE us.userID=@userID AND us.bookID=@bookID ORDER BY us.last_updated DESC`
      : `SELECT us.userID, us.bookID, us.status, us.started_reading_date, us.finished_reading_date, us.last_updated, b.title, b.coverImageURL FROM User_Shelves us LEFT JOIN Books b ON us.bookID = b.bookID WHERE us.userID=@userID ORDER BY us.last_updated DESC`;
    if (bookIDFilter) request.input('bookID', sql.NVarChar(64), bookIDFilter);
  const result = await request.query(sqlText);
  const rows = result.recordset || [];
  console.log(`User_Shelves: GET for user=${userID} returned ${rows.length} rows`);
  if (rows.length > 0) console.log('User_Shelves first row:', rows[0]);
  return NextResponse.json(rows.map((r: any) => ({
      userID: r.userID,
      bookID: r.bookID,
      status: r.status,
      started_reading_date: r.started_reading_date,
      finished_reading_date: r.finished_reading_date,
      last_updated: r.last_updated,
      title: r.title,
      coverImageURL: r.coverImageURL
    })));
  } catch (ex: any) {
    console.error('Shelves GET error', ex);
    return NextResponse.json({ Errore: ex?.message ?? String(ex) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireBasicAuth(req);
  if (!auth) return NextResponse.json({ Errore: 'Unauthorized' }, { status: 401 });
  if (!auth.user) return NextResponse.json({ Errore: 'User info missing' }, { status: 500 });
  const userID = auth.user.userID;

  try {
    const url = new URL(req.url);
    const bookID = url.searchParams.get('bookID');
    if (!bookID) return NextResponse.json({ Errore: 'Missing bookID' }, { status: 400 });

    const pool = await connectToDatabase();
    const request = pool.request();
    request.input('userID', sql.Int, userID);
    request.input('bookID', sql.NVarChar(64), bookID);
    const delSql = `DELETE FROM User_Shelves WHERE userID=@userID AND bookID=@bookID`;
    const res = await request.query(delSql);
    return NextResponse.json({ Result: 'Deleted', rowsAffected: res.rowsAffected });
  } catch (ex: any) {
    console.error('Shelves DELETE error', ex);
    return NextResponse.json({ Errore: ex?.message ?? String(ex) }, { status: 500 });
  }
}
