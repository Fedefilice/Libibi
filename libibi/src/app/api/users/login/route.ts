// Una classica POST login, riceve username e password in JSON, restituisce 401 se non validi, 200 con dati utente se validi

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateUserAsync, getByUsernameAsync } from '../../../../lib/userService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();   // legge username e password dal body JSON, se mancano restituisce 400
    const username = (body.username ?? '') as string;
    const password = (body.password ?? '') as string;
    if (!username || !password) {
      return NextResponse.json({ Errore: 'Missing credentials' }, { status: 400 });
    }

    // Valida le credenziali, se false restituisce 401
    const valid = await validateUserAsync(username, password);
    if (!valid) {
      return NextResponse.json({ Errore: 'Unauthorized' }, { status: 401 });
    }

    // Se valide, recupera i dati utente, se non esiste restituisce 404
    const user = await getByUsernameAsync(username);
    if (!user) return NextResponse.json({ Errore: 'User not found' }, { status: 404 });

    // Restituisce i dati utente senza la password, in formato JSON
    const resp = {
      Id: user.userID,
      Nome: user.nome,
      Cognome: user.cognome,
      Username: user.username,
      Email: user.email,
      Admin: user.admin,
    };

    return NextResponse.json(resp);
  } catch (ex: any) {
    console.error('Login error', ex);
    return NextResponse.json({ Errore: ex?.message ?? String(ex) }, { status: 500 });
  }
}
