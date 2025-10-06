"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBookDetails, BookDetail } from '../../../../hooks/useBookDetails';
import BookCard from '../../../../components/ui/BookCard';
import CreateReview from '../../../../components/ui/CreateReview';
import ReviewsList from '../../../../components/ui/ReviewsList';

// Pagina di dettaglio del libro
const BookDetailSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{label}</h3>
    <div className="text-gray-700">{children}</div>
  </div>
);

export default function BookPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Unrapped, tramite react 
  const resolvedParams = React.use(params as Promise<{ id: string }>);
  const bookId = decodeURIComponent(resolvedParams.id);
  const { book, loading, error } = useBookDetails(bookId);

  const [status, setStatus] = useState<string>('want_to_read');
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [needLoginPrompt, setNeedLoginPrompt] = useState(false);
  const [bookPresent, setBookPresent] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);

  const statusLabelMap: Record<string, string> = {
    WantToRead: 'Voglio leggerlo',
    Reading: 'Sto leggendo',
    Read: 'Letto',
    Abandoned: 'Abbandonato',
    want_to_read: 'Voglio leggerlo',
    reading: 'Sto leggendo',
    finished: 'Letto',
    abandoned: 'Abbandonato'
  };

  // Helper per leggere in modo sicuro le credenziali memorizzate in localStorage
  function getStoredCreds(): { username: string; password: string } | null {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem('libibi_credentials');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.username || !parsed.password) return null;
      return { username: parsed.username, password: parsed.password };
    } catch (e) {
      console.debug('Error reading stored creds', e);
      return null;
    }
  }

  function normalizeStatusKey(s: string | null | undefined) {
    if (!s) return s as any;
    const map: Record<string, string> = {
      'want_to_read': 'want_to_read',
      'reading': 'reading',
      'finished': 'finished',
      'abandoned': 'abandoned',
      'WantToRead': 'WantToRead',
      'Reading': 'Reading',
      'Read': 'Read',
      'Abandoned': 'Abandoned'
    };
    return map[s] ?? s;
  }

  async function handleAddToLibrary() {
    try {
      if (!book) {
        alert('Dati libro non disponibili');
        return;
      }
      const creds = getStoredCreds();
      if (!creds) {
        console.debug('No stored credentials found when attempting to add to library');
        // Mostra messaggio inline e suggerimento per effettuare il login
        setNeedLoginPrompt(true);
        setFlash({ type: 'error', text: 'Devi essere loggato per aggiungere un libro alla tua libreria.' });
        setTimeout(() => setFlash(null), 5000);
        return;
      }
  console.debug('handleAddToLibrary - stored creds:', { username: creds.username, hasPassword: !!creds.password });
  const auth = btoa(`${creds.username}:${creds.password}`);
  console.debug('handleAddToLibrary - will send Authorization header present:', !!auth);

      const body: any = {
        bookID: book.WorkKey,
        status
      };

      setAdding(true);
      const res = await fetch('/api/users/shelves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify(body)
      });
      setAdding(false);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFlash({ type: 'error', text: err.Errore || 'Si è verificato un errore durante l\'aggiunta del libro.' });
        setTimeout(() => setFlash(null), 5000);
        return;
      }

      const italianStatus = statusLabelMap[normalizeStatusKey(status)] || statusLabelMap[status] || status;
  setBookPresent(true);
  // Converte lo stato in un valore normalizzato
  const serverVal = (status === 'abandoned') ? 'Abandoned' : normalizeStatusKey(status);
  setServerStatus(serverVal);
      setFlash({ type: 'success', text: `"${book.Title}" è stato aggiunto alla tua libreria. Stato: ${italianStatus}` });
      setTimeout(() => setFlash(null), 5000);
    } catch (e) {
      setAdding(false);
      console.error(e);
      alert('Errore di rete');
    }
  }

  async function handleRemoveFromLibrary() {
    try {
      const creds = getStoredCreds();
      if (!creds) {
        setFlash({ type: 'error', text: 'Devi essere loggato per rimuovere un libro dalla tua libreria.' });
        setTimeout(() => setFlash(null), 4000);
        return;
      }
      console.debug('handleRemoveFromLibrary - stored creds:', { username: creds.username, hasPassword: !!creds.password });
      const auth = btoa(`${creds.username}:${creds.password}`);
      console.debug('handleRemoveFromLibrary - will send Authorization header present:', !!auth);
      const workKey = book?.WorkKey ?? bookId;
      const titleForMsg = book?.Title ?? bookId;
      // Se lo stato del server è "Reading", sposta in "Abandoned" una volta rimosso
      if (serverStatus === 'Reading') {
        const body = { bookID: workKey, status: 'abandoned' };
        const resPost = await fetch('/api/users/shelves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
          body: JSON.stringify(body)
        });
        if (!resPost.ok) {
          const err = await resPost.json().catch(() => ({}));
          setFlash({ type: 'error', text: err.Errore || 'Errore aggiornando lo stato del libro.' });
          setTimeout(() => setFlash(null), 4000);
          return;
        }
        // Tieni il libro presente nel profilo ma aggiorna lo stato
        setBookPresent(true);
        setServerStatus('Abandoned');
        setStatus('abandoned');
        setFlash({ type: 'success', text: `"${titleForMsg}" è stato spostato in 'Abbandonato'.` });
        setTimeout(() => setFlash(null), 4000);
        return;
      }

      // Rimozione normale ed effettiva
      const res = await fetch(`/api/users/shelves?bookID=${encodeURIComponent(workKey)}`, {
        method: 'DELETE',
        headers: { Authorization: `Basic ${auth}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFlash({ type: 'error', text: err.Errore || 'Errore rimuovendo il libro.' });
        setTimeout(() => setFlash(null), 4000);
        return;
      }
      setBookPresent(false);
      setServerStatus(null);
      setFlash({ type: 'success', text: `"${titleForMsg}" è stato rimosso dalla tua libreria.` });
      setTimeout(() => setFlash(null), 4000);
    } catch (ex) {
      console.error(ex);
      setFlash({ type: 'error', text: 'Errore di rete durante la rimozione.' });
      setTimeout(() => setFlash(null), 4000);
    }
  }

  useEffect(() => {
    async function loadShelf() {
      try {
        const creds = getStoredCreds();
        if (!creds) {
          console.debug('loadShelf - no stored creds');
          return;
        }
        console.debug('loadShelf - stored creds found', { username: creds.username, hasPassword: !!creds.password });
        const auth = btoa(`${creds.username}:${creds.password}`);
        console.debug('loadShelf - will call GET /api/users/shelves with Authorization present:', !!auth);
        const workKey = book?.WorkKey ?? bookId;
        const res = await fetch(`/api/users/shelves?bookID=${encodeURIComponent(workKey)}`, { headers: { Authorization: `Basic ${auth}` } });
        if (!res.ok) return;
        const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const row = data[0];
            setBookPresent(true);
            setServerStatus(row.status ?? null);
            const clientStatus = (row.status === 'WantToRead') ? 'want_to_read' : (row.status === 'Reading' ? 'reading' : (row.status === 'Read' ? 'finished' : (row.status === 'Abandoned' ? 'abandoned' : 'want_to_read')));
            setStatus(clientStatus);
          }
      } catch (ex) {
        console.error('Errore caricando lo stato della scaffale', ex);
      }
    }
    loadShelf();
  }, [bookId]);

  if (loading) {
    return (
      <div className="container mx-auto px-8 py-12 flex justify-center items-center min-h-[500px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-accent)] border-t-transparent mb-4"></div>
          <p className="text-lg text-[var(--color-foreground)]">Caricamento dettagli libro...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-8 py-12">
        <div className="max-w-3xl mx-auto bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Errore</h2>
          <p className="text-gray-700">{error}</p>
          <Link
            href="/data/search"
            className="inline-block mt-6 px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-foreground)] transition-colors"
          >
            Torna alla ricerca
          </Link>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container mx-auto px-8 py-12">
        <div className="max-w-3xl mx-auto bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Libro non trovato</h2>
          <p className="text-gray-700">Non è stato possibile trovare il libro richiesto.</p>
          <Link
            href="/data/search"
            className="inline-block mt-6 px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-foreground)] transition-colors"
          >
            Torna alla ricerca
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <nav className="mb-8 text-gray-500">
          <ol className="flex space-x-2">
            <li>
              <Link href="/" className="hover:text-[var(--color-accent)]">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/data/search" className="hover:text-[var(--color-accent)]">
                Ricerca
              </Link>
            </li>
            <li>/</li>
            <li className="truncate max-w-xs">
              <span className="text-[var(--color-foreground)]">{book.Title}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-1">
              <div className="flex justify-center">
              <BookCard
                book={{
                  Title: book.Title,
                  AuthorName: book.Author,
                  CoverUrl: book.CoverUrl,
                  Rating: book.Rating,
                  AuthorKey: book.AuthorKey,
                  WorkKey: book.WorkKey
                }}
                showAddButton={false}
                className="transform scale-95"
              />
              </div>
          </div>

          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-4">Dettagli</h1>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {book.FirstPublishYear && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Anno di pubblicazione</h3>
                  <p className="text-lg">{book.FirstPublishYear}</p>
                </div>
              )}

              {book.NumberOfPagesMedian && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Numero di pagine</h3>
                  <p className="text-lg">{book.NumberOfPagesMedian}</p>
                </div>
              )}

              {book.Rating && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Valutazione</h3>
                  <p className="text-lg">{book.Rating.toFixed(1)}/5</p>
                </div>
              )}
            </div>

            <BookDetailSection label="Descrizione">
              {book.Description ? (
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: book.Description }} />
              ) : (
                <p className="italic text-gray-500">Nessuna descrizione disponibile per questo libro.</p>
              )}
            </BookDetailSection>

            {book.Subject && book.Subject.length > 0 && (
              <BookDetailSection label="Argomenti">
                <div className="flex flex-wrap gap-2">
                  {book.Subject.slice(0, 5).map((subject: string, index: number) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">{subject}</span>
                  ))}
                  {book.Subject.length > 5 && (
                    <span className="text-gray-500 text-sm ml-1 self-center">+{book.Subject.length - 5} altri</span>
                  )}
                </div>
              </BookDetailSection>
            )}

            <div className="mt-6 p-4 bg-white rounded shadow-sm max-w-md">
              <h3 className="text-lg font-medium mb-3">Aggiungi alla tua libreria</h3>
              <div className="flex items-center gap-3 mb-3">
                <label className="text-sm">Stato:</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-2">
                  <option value="want_to_read">Voglio leggerlo</option>
                  <option value="reading">Sto leggendo</option>
                  <option value="finished">Letto</option>
                  <option value="abandoned">Abbandonato</option>
                </select>
              </div>

              <div>
                {!bookPresent ? (
                  <div>
                    <button disabled={adding} onClick={handleAddToLibrary} className="px-6 py-3 bg-[#a86c3c] text-white rounded">
                      {adding ? 'Aggiungendo...' : 'Aggiungi alla libreria'}
                    </button>
                    {needLoginPrompt && (
                      <div className="mt-3 text-sm text-red-700">
                        Devi essere <a href="/user/login" className="underline font-medium">loggato</a> per aggiungere un libro alla tua libreria.
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={handleRemoveFromLibrary} className="px-6 py-3 bg-gray-200 text-[#a86c3c] rounded border border-gray-300">Rimuovi dalla libreria</button>
                )}
              </div>

              {flash && (
                <div className={`mt-4 p-3 rounded transition-opacity duration-300 ${flash.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                  {flash.text}
                </div>
              )}
            </div>
             <div className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {/* Form recensione smooth */}
                    <details className="create-review-collapse rounded p-3">
                      <summary className="cursor-pointer font-medium text-[var(--color-accent)]">Lo hai letto? Recensiscilo</summary>
                      <div className="mt-3">
                        <CreateReview bookID={book.WorkKey} onSuccess={() => setReviewsRefreshKey(k => k + 1)} />
                      </div>
                    </details>
                  </div>
                  <div>
                    <ReviewsList bookID={book.WorkKey} limit={8} key={reviewsRefreshKey} />
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}