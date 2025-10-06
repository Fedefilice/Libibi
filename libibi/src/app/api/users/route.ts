// Una classica GET user
// endpoint REST

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireBasicAuth } from '../../../lib/basicAuth';
import { connectToDatabase, sql } from '../../../../lib/db';

export async function GET(req: NextRequest) {
  // Richiede Basic Auth, se null restituisce 401 (unauthorized)
  const auth = await requireBasicAuth(req);
  if (!auth) return NextResponse.json({ Errore: 'Unauthorized' }, { status: 401 });

  // Se autorizzato, legge username e password dai parametri della query string
  const url = new URL(req.url);
  const username = url.searchParams.get('username') || '';
  const password = url.searchParams.get('password') || '';

  // Esegue la query per trovare l'utente con username e password corrispondenti
  try {
    const pool = await connectToDatabase();
    const request = pool.request();
    request.input('username', sql.NVarChar(100), username);
    request.input('password', sql.NVarChar(255), password);
    const result = await request.query('SELECT userID, nome, cognome, username, email, passwd, Admin FROM Users WHERE Username = @username AND Passwd = @password');
    const row = result.recordset[0];
    if (!row) return NextResponse.json({ Errore: 'Utente non trovato o credenziali errate' }, { status: 404 });
    const ret = {
      Id: row.userID,
      Nome: row.nome,
      Cognome: row.cognome,
      Username: row.username,
      Email: row.email,
      Passwd: row.passwd,
      Admin: !!row.Admin
    };
    return NextResponse.json(ret);
  } catch (ex: any) {
    console.error('GetID error', ex);
    return NextResponse.json({ Errore: ex.toString() }, { status: 400 });
  }
}
