import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireBasicAuth } from '../../../../services/basicAuth';

export async function GET(req: NextRequest) {
  const auth = await requireBasicAuth(req);
  if (!auth) return NextResponse.json({ Errore: 'Unauthorized' }, { status: 401 });

  const username = auth.username;
  return NextResponse.json({ Message: 'Auth is up!', ServerTime: new Date().toISOString(), Username: username });
}
