// Post per la registrazione di un nuovo utente

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connectToDatabase, sql } from '../../../../../lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await req.json();
    if (!user) return NextResponse.json({ Errore: 'Oggetto utente nullo' }, { status: 400 });

    const pool = await connectToDatabase();

    // Controlla se Username o Email esistono già
    const checkRequest = pool.request();
    checkRequest.input('Username', sql.NVarChar(100), user.Username || '');
    checkRequest.input('Email', sql.NVarChar(255), user.Email || '');
    const existsResult = await checkRequest.query(
      'SELECT Username, Email FROM Users WHERE Username = @Username OR Email = @Email'
    );
    if (existsResult.recordset && existsResult.recordset.length > 0) {
      const rows = existsResult.recordset as any[];
      const usernameExists = rows.some(r => r.Username && user.Username && r.Username.toString().toLowerCase() === user.Username.toString().toLowerCase());
      const emailExists = rows.some(r => r.Email && user.Email && r.Email.toString().toLowerCase() === user.Email.toString().toLowerCase());
      const messages: string[] = [];
      if (usernameExists) messages.push('Username già esistente nei nostri server');
      if (emailExists) messages.push('Email già esistente nei nostri server');
      const msg = messages.length > 0 ? messages.join('; ') : 'Username o Email già presenti';
      return NextResponse.json({ Errore: msg }, { status: 409 });
    }

    const request = pool.request();
    request.input('Nome', sql.NVarChar(50), user.Nome || '');
    request.input('Cognome', sql.NVarChar(50), user.Cognome || '');
    request.input('Username', sql.NVarChar(100), user.Username || '');
    request.input('Email', sql.NVarChar(255), user.Email || '');
    request.input('Passwd', sql.NVarChar(255), user.Passwd || '');

    const insertQuery = `INSERT INTO Users (Nome, Cognome, Username, Email, Passwd) VALUES (@Nome, @Cognome, @Username, @Email, @Passwd)`;
    await request.query(insertQuery);

    const ret = {
      Nome: user.Nome,
      Cognome: user.Cognome,
      Username: user.Username,
      Email: user.Email,
      Passwd: user.Passwd
    };
    return NextResponse.json(ret);
  } catch (ex: any) {
    console.error('Errore insert user', ex);
    return NextResponse.json({ Errore: ex.toString() }, { status: 400 });
  }
}
