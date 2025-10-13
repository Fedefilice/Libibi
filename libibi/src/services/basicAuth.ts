// Serve per leggere header Authentication Basic, decodifica in Base64 e separa username:password

import { NextRequest } from 'next/server';
import { validateUserAsync, userRoles, getByUsernameAsync } from './userService';

export async function parseBasicAuthHeader(req: NextRequest) {
  const header = req.headers.get('authorization');
  if (!header) return null;
  if (!header.toLowerCase().startsWith('basic ')) return null;
  try {
    const token = header.substring(6);
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 2) return null;
    return { username: parts[0], password: parts[1] };
  } catch (e) {
    return null;
  }
}

export async function requireBasicAuth(req: NextRequest) {
  const creds = await parseBasicAuthHeader(req);
  if (!creds) return null;
  const valid = await validateUserAsync(creds.username, creds.password);
  if (!valid) return null;
  const roles = await userRoles(creds.username);
  const user = await getByUsernameAsync(creds.username);
  return { username: creds.username, roles, user };
}
//ritorna { username: creds.username, roles, user } se tutto ok, altrimenti null
// user contiene i dettagli dell'utente (senza password) se trovato
// roles è un array di stringhe con i ruoli associati all'utente