import { NextRequest, NextResponse } from 'next/server';
import { openLibraryService } from '../../../../services/open_library_services';

/**
 * Endpoint API per la ricerca di libri solo su OpenLibrary
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('termineRicerca') || '';
  
  if (!query) {
    return NextResponse.json(
      { errore: 'Termine di ricerca non valido' },
      { status: 400 }
    );
  }

  try {
    // Cerca libri su OpenLibrary
    const books = await openLibraryService.getListBookAsync(query);
    
    // Trasforma i risultati nel formato desiderato
    const results = books.map(book => ({
      Title: book.title,
      AuthorName: book.author || [],
      CoverUrl: book.coverUrl,
      Rating: book.rating,
      AuthorKey: book.authorKey || [],
      WorkKey: book.workKey
    }));

    if (results.length === 0) {
      return NextResponse.json({ Messaggio: "non sono stati trovati risultati corrispondenti alla richiesta" });
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Errore durante la ricerca su OpenLibrary:', error);
    return NextResponse.json(
      { errore: error instanceof Error ? error.toString() : 'Errore sconosciuto' },
      { status: 400 }
    );
  }
}