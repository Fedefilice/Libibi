import { connectToDatabase, sql } from '../../lib/db';

// Libreria per la gestione degli utenti, usata dalle API e potenzialmente da altre parti dell'applicazione

export type UserRecord = {
  userID: number;
  nome: string | null;
  cognome: string | null;
  username: string | null;
  email: string | null;
  passwd: string | null;
  admin: boolean;
};

// Valida credenziali utente e restituisce valore booleano, non restituisce le credenziali, ma serve solo per validazione
export async function validateUserAsync(username: string, password: string): Promise<boolean> {
  const pool = await connectToDatabase();
  const request = pool.request();
  request.input('Username', sql.NVarChar(100), username);
  // Use a fixed length for the password parameter. The previous expression compared unrelated types and caused
  // a compile-time error. 255 is a safe fallback for NVARCHAR password columns.
  request.input('Password', sql.NVarChar(255), password);

  const result = await request.query('SELECT COUNT(*) as cnt FROM Users WHERE Username = @Username AND Passwd = @Password');
  const count = result.recordset[0]?.cnt ?? 0;
  return count > 0;
}

// Restituisce i ruoli associati a un utente, utilizza Promises (operazione asincrona)
export async function userRoles(username: string): Promise<string[]> {
  const roles: string[] = [];
  const pool = await connectToDatabase();
  const request = pool.request();
  request.input('Username', sql.NVarChar(100), username);
  const result = await request.query('SELECT Admin FROM Users WHERE Username = @Username');
  const val = result.recordset[0]?.Admin;
  if (val !== undefined && val !== null && !!val) roles.push('Admin');
  else roles.push('User');
  return roles;
}

// Restituisce i dettagli dell'utente dato uno username 
export async function getByUsernameAsync(username: string): Promise<UserRecord | null> {
  const pool = await connectToDatabase();
  const request = pool.request();
  request.input('Username', sql.NVarChar(100), username);
  const result = await request.query('SELECT userID, nome, cognome, username, email, passwd, Admin FROM Users WHERE Username = @Username');
  const row = result.recordset[0];
  if (!row) return null;
  return {
    userID: row.userID,
    nome: row.nome ?? null,
    cognome: row.cognome ?? null,
    username: row.username ?? null,
    email: row.email ?? null,
    passwd: row.passwd ?? null,
    admin: !!row.Admin
  };
}
