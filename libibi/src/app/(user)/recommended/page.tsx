"use client";

import React, { useState, useEffect } from 'react';
import { useIsLoggedIn } from '@/hooks/useAuth';
import { BookShelf } from '@/types';
import { parseBookTitles } from '@/app/api/recommended/route';
import BookCard from '@/components/book/BookCard';
import { BookSearchResult } from '@/types/book';

export default function RecommendationsPage() {
  const { isLoggedIn, isChecking } = useIsLoggedIn();
  const [recommendations, setRecommendations] = useState<BookSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userBooks, setUserBooks] = useState<{
    read: BookShelf[];
    reading: BookShelf[];
    wantToRead: BookShelf[];
    abandoned: BookShelf[];
  } | null>(null);

  // Funzione per ottenere i libri dell'utente dal database
  async function fetchUserBooks() {
    if (!isLoggedIn) return null;

    try {
      const auth = localStorage.getItem('libibi_credentials');
      if (!auth) return null;

      const creds = JSON.parse(auth);
      const token = btoa(`${creds.username}:${creds.password}`);

      // Ottiene tutti i libri dell'utente
      const response = await fetch('/api/users/shelves', {
        headers: { 'Authorization': `Basic ${token}` }
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento dei libri');
      }

      const allBooks: BookShelf[] = await response.json();

      // Organizza i libri per categorie
      const categorizedBooks = {
        read: allBooks.filter(book => book.status === 'Read'),
        reading: allBooks.filter(book => book.status === 'Reading'),
        wantToRead: allBooks.filter(book => book.status === 'WantToRead'),
        abandoned: allBooks.filter(book => book.status === 'Abandoned')
      };

      return categorizedBooks;
    } catch (error) {
      console.error('Errore nel caricamento libri:', error);
      return null;
    }
  }

  // Funzione per ottenere raccomandazioni
  async function getRecommendations() {
    setLoading(true);
    setError(null);

    try {
      const books = await fetchUserBooks();
      if (!books) {
        setError('Impossibile caricare i tuoi libri');
        return;
      }

      setUserBooks(books);

      // Verifica che l'utente abbia almeno alcuni libri
      const totalBooks = books.read.length + books.reading.length + 
                        books.wantToRead.length + books.abandoned.length;
      
      if (totalBooks === 0) {
        setError('Aggiungi alcuni libri alla tua libreria per ricevere raccomandazioni personalizzate!');
        return;
      }

      // Ottieni le credenziali per l'API
      const auth = localStorage.getItem('libibi_credentials');
      if (!auth) {
        setError('Credenziali di autenticazione non trovate');
        return;
      }

      const creds = JSON.parse(auth);
      const token = btoa(`${creds.username}:${creds.password}`);

      // Chiama l'API raccomandazioni
      const response = await fetch('/api/recommended', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Basic ${token}`
        },
        credentials: 'include', // Include cookies per l'autenticazione
        body: JSON.stringify({ userBooks: books })
      });

      if (!response.ok) {
        throw new Error('Errore nel servizio raccomandazioni');
      }

      const data = await response.json();
      
      // Parsa i titoli dalla risposta
      const bookTitles = parseBookTitles(data.result);
      
      // Cerca ogni libro raccomandato su OpenLibrary per ottenere i dettagli completi
      const bookResults: BookSearchResult[] = [];
      
      for (const title of bookTitles) {
        try {
          // Cerca il libro tramite l'API di ricerca
          const searchResponse = await fetch(`/api/search/openLibrary?termineRicerca=${encodeURIComponent(title)}`);
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            
            // Se trovato, prendi il primo risultato
            if (Array.isArray(searchData) && searchData.length > 0) {
              bookResults.push({
                ...searchData[0],
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
          } else {
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
      
      setRecommendations(bookResults);

    } catch (error: any) {
      setError(error.message || 'Errore nel caricamento delle raccomandazioni');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      getRecommendations();
    }
  }, [isLoggedIn]);

  // Mostra loading mentre controlla l'autenticazione
  if (isChecking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card max-w-2xl mx-auto text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-accent)] border-t-transparent mb-4"></div>
          <p className="text-lg text-gray-600">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card max-w-2xl mx-auto text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-3xl font-serif text-[var(--color-foreground)] mb-4">
              Accesso Richiesto
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Per accedere alle raccomandazioni personalizzate è necessario effettuare l'accesso. 
              Le nostre raccomandazioni sono basate sui tuoi libri preferiti e la tua cronologia di lettura.
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <a 
                href="/login" 
                className="btn btn-accent text-xl py-3 px-8 mr-4"
              >
                Accedi
              </a>
              <a 
                href="/register" 
                className="btn btn-ghost text-xl py-3 px-8"
              >
                Registrati
              </a>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Hai già un account? <a href="/login" className="text-[var(--color-accent)] hover:underline">Accedi qui</a><br/>
              Nuovo utente? <a href="/register" className="text-[var(--color-accent)] hover:underline">Crea un account gratuito</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-[var(--color-foreground)] mb-4">
            I Tuoi Libri Raccomandati
          </h1>
          <p className="text-xl text-gray-600">
            Raccomandazioni personalizzate basate sui tuoi gusti di lettura
          </p>
        </div>

        {/* Statistiche libri utente */}
        {userBooks && (
          <div className="card mb-8">
            <h2 className="text-2xl font-serif text-[var(--color-foreground)] mb-4">
              La Tua Libreria
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-accent)] mb-1">
                  {userBooks.read.length}
                </div>
                <div className="text-gray-600">Letti</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-accent)] mb-1">
                  {userBooks.reading.length}
                </div>
                <div className="text-gray-600">Leggendo</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-accent)] mb-1">
                  {userBooks.wantToRead.length}
                </div>
                <div className="text-gray-600">Voglio Leggere</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-[var(--color-accent)] mb-1">
                  {userBooks.abandoned.length}
                </div>
                <div className="text-gray-600">Abbandonati</div>
              </div>
            </div>
          </div>
        )}

        {/* Raccomandazioni */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif text-[var(--color-foreground)]">
              Raccomandazioni per Te
            </h2>
            <button 
              onClick={getRecommendations}
              disabled={loading}
              className="btn btn-ghost"
            >
              {loading ? 'Caricamento...' : 'Aggiorna'}
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[var(--color-accent)] border-t-transparent mb-4"></div>
              <p className="text-gray-600">Sto analizzando i tuoi gusti di lettura e cercando i migliori libri per te...</p>
              <p className="text-sm text-gray-500 mt-2">Questo potrebbe richiedere qualche momento</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-lg">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && recommendations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-items-center max-w-5xl mx-auto">
              {recommendations.map((book, index) => (
                <div 
                  key={index}
                  onClick={() => {
                    // Se il libro è stato trovato su OpenLibrary, vai alla pagina del libro
                    if (book.WorkKey && !book.WorkKey.startsWith('search:')) {
                      window.open(`/book/${encodeURIComponent(book.WorkKey)}`, '_blank');
                    } else {
                      // Altrimenti reindirizza alla ricerca
                      const searchUrl = `/search?q=${encodeURIComponent(book.Title)}`;
                      window.open(searchUrl, '_blank');
                    }
                  }}
                  className="cursor-pointer transform hover:scale-105 transition-transform"
                >
                  <BookCard 
                    book={book}
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && recommendations.length === 0 && userBooks && (
            <div className="text-center py-8">
              <p className="text-gray-600 text-lg">
                Nessuna raccomandazione disponibile al momento.
              </p>
              <button 
                onClick={getRecommendations}
                className="btn btn-accent mt-4"
              >
                Riprova
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}