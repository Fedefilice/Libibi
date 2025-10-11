"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIsLoggedIn } from '@/hooks/useAuth';
import { BookShelf } from '@/types';
import BookCard from '@/components/book/BookCard';
import { BookSearchResult } from '@/types/book';

export default function RecommendationsPage() {
  const { isLoggedIn, isChecking } = useIsLoggedIn();
  const router = useRouter();
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
      
      // The API now returns the complete book data directly
      const bookResults = Array.isArray(data) ? data : [];
      
      setRecommendations(bookResults);

    } catch (error: any) {
      setError(error.message || 'Errore nel caricamento delle raccomandazioni');
    } finally {
      setLoading(false);
    }
  }

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isChecking && !isLoggedIn) {
      router.push('/login');
      return;
    }
    
    if (isLoggedIn) {
      getRecommendations();
    }
  }, [isLoggedIn, isChecking, router]);

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

  // If not logged in, the useEffect above will redirect to login
  if (!isLoggedIn) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-[var(--color-foreground)] mb-4">
            Consigli di lettura per te
          </h1>
        </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[var(--color-accent)] border-t-transparent mb-4"></div>
              <p className="text-gray-600">Sto analizzando i tuoi gusti di lettura e cercando i migliori libri per te...</p>
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
            <div className="flex flex-wrap gap-8 justify-center max-w-6xl mx-auto">
              {recommendations.map((book, index) => (
                <div 
                  key={index}
                  onClick={() => {
                    // Se il libro è stato trovato su OpenLibrary, vai alla pagina del libro
                    if (book.WorkKey && !book.WorkKey.startsWith('search:')) {
                      router.push(`/book/${encodeURIComponent(book.WorkKey)}`);
                    } else {
                      // Altrimenti reindirizza alla ricerca
                      const searchUrl = `/search?q=${encodeURIComponent(book.Title)}`;
                      router.push(searchUrl);
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
  );
}