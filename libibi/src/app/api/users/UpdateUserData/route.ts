import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireBasicAuth } from '../../../../lib/basicAuth';
import { connectToDatabase, sql } from '../../../../../lib/db';

// Aggiorna i dati di un utente esistente (tranne la password, che va cambiata a parte)
// Non ancora implementato

export async function POST(req: NextRequest) {
  const auth = await requireBasicAuth(req);
  if (!auth) return NextResponse.json({ Errore: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  if (!body || !body.Username) return NextResponse.json({ Errore: 'Dati utente non validi' }, { status: 400 });

  try {
    const pool = await connectToDatabase();
    const request = pool.request();
    request.input('Username', sql.NVarChar(100), body.Username);

    // Controlla se l'utente esiste
    const sel = await request.query('SELECT * FROM Users WHERE Username = @Username');
    if (!sel.recordset || sel.recordset.length === 0) return NextResponse.json({ Errore: 'Utente non trovato' }, { status: 404 });

    const existing = sel.recordset[0];
    const Nome = body.Nome || existing.Nome;
    const Cognome = body.Cognome || existing.Cognome;
    const Email = body.Email || existing.Email;
    const Admin = body.Admin === undefined ? existing.Admin : body.Admin;

    const updReq = pool.request();
    updReq.input('Nome', sql.NVarChar(50), Nome ?? '');
    updReq.input('Cognome', sql.NVarChar(50), Cognome ?? '');
    updReq.input('Email', sql.NVarChar(255), Email ?? '');
    updReq.input('Admin', sql.Bit, Admin);
    updReq.input('Username', sql.NVarChar(100), body.Username);

    const updateQuery = `UPDATE Users SET Nome = @Nome, Cognome = @Cognome, Email = @Email, Admin = @Admin WHERE Username = @Username`;
    const res = await updReq.query(updateQuery);
    if (res.rowsAffected && res.rowsAffected[0] === 0) return NextResponse.json({ Errore: 'Utente non trovato' }, { status: 404 });

    return NextResponse.json({ Nome, Cognome, Username: body.Username, Email, Passwd: null });
  } catch (ex: any) {
    console.error('UpdateUserData error', ex);
    return NextResponse.json({ Errore: ex.toString() }, { status: 400 });
  }
}
