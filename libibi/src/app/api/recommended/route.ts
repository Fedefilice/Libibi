import { NextRequest } from 'next/server';
import { requireBasicAuth } from '../../../services/basicAuth';
import { parseBookTitles } from '../../../../lib/bookUtils';
import { aiRecommendationService } from '../../../services/aiRecommendationService';
import { userBookService } from '../../../services/userBookService';
import { BookSearchResult } from '../../../types/book';

export async function POST(req: NextRequest): Promise<Response> {
  try {
    console.log('Recommended API called');
    
    // Richiede Basic Auth 
    const auth = await requireBasicAuth(req);
    if (!auth) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!auth.user) return Response.json({ error: 'User info missing' }, { status: 500 });
    
    const userID: number = auth.user.userID;
    console.log('User ID:', userID);

    // Recupera i libri dell'utente dal database usando il service
    const userBooks = await userBookService.getUserBooks(userID);

    // Genera raccomandazioni usando il service AI
    const recommendedTitles = await aiRecommendationService.generateRecommendations(userBooks);
    
    // Cerca ogni libro raccomandato nel database e su OpenLibrary
    const bookResults: BookSearchResult[] = [];
    
    for (const title of recommendedTitles) {
      try {
        // Cerca usando il service per i libri
        const searchResults = await userBookService.searchBooks(title);
        
        // Se trovato, prendi il primo risultato
        if (Array.isArray(searchResults) && searchResults.length > 0) {
          bookResults.push({
            ...searchResults[0],
            isExternal: true
          });
        } else {
          // Se non trovato, crea un oggetto con dati minimi
          bookResults.push({
            Title: title,
            AuthorName: ["Autore da cercare"],
            CoverUrl: "/book-image.jpg",
            Rating: null,
            AuthorKey: [],
            WorkKey: `search:${encodeURIComponent(title)}`,
            isExternal: true
          });
        }
      } catch (error) {
        console.error(`Errore nella ricerca del libro "${title}":`, error);
        // In caso di errore, crea oggetto con dati minimi
        bookResults.push({
          Title: title,
          AuthorName: ["Errore nella ricerca"],
          CoverUrl: "/book-image.jpg",
          Rating: null,
          AuthorKey: [],
          WorkKey: `search:${encodeURIComponent(title)}`,
          isExternal: true
        });
      }
    }
    
    return Response.json(bookResults);

  } catch (error: any) {
    console.error('Errore API raccomandazioni:', error);
    return Response.json({ 
      error: "Errore interno del server",
      details: error.message 
    }, { status: 500 });
  }
}

