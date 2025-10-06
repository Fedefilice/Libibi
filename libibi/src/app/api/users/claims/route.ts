import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireBasicAuth } from '../../../../lib/basicAuth';

// Restituisce le claims dell'utente autenticato (utile per modifica dati utente, per ora teniamo, nel caso serva)
export async function GET(req: NextRequest) {
  const auth = await requireBasicAuth(req);
  if (!auth) return NextResponse.json({ Errore: 'Unauthorized' }, { status: 401 });

  const user = auth.user;
  if (!user) return NextResponse.json({ Errore: 'Utente non trovato' }, { status: 404 });

  const claims = [
    { Type: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name', Value: user.username },
    { Type: 'Nome', Value: user.nome },
    { Type: 'Cognome', Value: user.cognome },
    { Type: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress', Value: user.email },
    { Type: 'Admin', Value: user.admin.toString() }
  ];

  return NextResponse.json(claims);
}
