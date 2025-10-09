"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBookDetails } from '../../../../hooks/useBookDetails';
import BookCard from '../../../../components/book/BookCard';
import AddToLibrary from '../../../../components/book/AddToLibrary';
import BookReviewsSection from '../../../../components/book/BookReviewsSection';
import { Breadcrumb } from '../../../components/navigation';

// Pagina di dettaglio del libro
const BookDetailSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{label}</h3>
    <div className="text-gray-700">{children}</div>
  </div>
);

export default function BookPage({ params }: { params: Promise<{ id: string }> }) {
  // Unrapped, tramite react 
  const resolvedParams = React.use(params);
  const bookId = decodeURIComponent(resolvedParams.id);
  const { book, loading, error } = useBookDetails(bookId);

  const [status, setStatus] = useState<string>('want_to_read');
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [needLoginPrompt, setNeedLoginPrompt] = useState(false);
  const [bookPresent, setBookPresent] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | null>(null);

  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [hasReviews, setHasReviews] = useState(false);

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

  // Controlla se l'utente ha già recensito il libro
  async function checkUserReview() {
    try {
      const creds = getStoredCreds();
      if (!creds) {
        setUserHasReviewed(false);
        return;
      }
      
      const auth = btoa(`${creds.username}:${creds.password}`);
      const res = await fetch('/api/review/user', { headers: { Authorization: `Basic ${auth}` } });
      
      if (!res.ok) {
        setUserHasReviewed(false);
        return;
      }
      
      const reviews = await res.json();
      const hasReviewed = Array.isArray(reviews) && reviews.some((r: any) => r.bookID === bookId);
      setUserHasReviewed(hasReviewed);
    } catch (ex) {
      console.error('Errore controllando recensione utente', ex);
      setUserHasReviewed(false);
    }
  }

  // Controlla se ci sono recensioni per questo libro
  async function checkBookReviews() {
    try {
      const res = await fetch(`/api/review?bookId=${encodeURIComponent(bookId)}`);
      if (!res.ok) {
        setHasReviews(false);
        return;
      }
      
      const reviews = await res.json();
      const reviewsExist = Array.isArray(reviews) && reviews.length > 0;
      setHasReviews(reviewsExist);
    } catch (ex) {
      console.error('Errore controllando recensioni libro', ex);
      setHasReviews(false);
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
    checkUserReview();
    checkBookReviews();
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
            href="/search"
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
            href="/search"
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
        <Breadcrumb items={[
          { label: 'Ricerca', href: '/search' },
          { label: book.Title }
        ]} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-1">
              <div className="flex flex-col items-center space-y-6">
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
                />
                
                <AddToLibrary
                  status={status}
                  onStatusChange={setStatus}
                  bookPresent={bookPresent}
                  adding={adding}
                  needLoginPrompt={needLoginPrompt}
                  flash={flash}
                  onAddToLibrary={handleAddToLibrary}
                  onRemoveFromLibrary={handleRemoveFromLibrary}
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
                </div>
              </BookDetailSection>
            )}

          </div>
        </div>

        {/* Sezione Recensioni - Visibile solo se ci sono recensioni o se l'utente può aggiungerne una */}
        {(hasReviews || !userHasReviewed) && (
          <BookReviewsSection
            bookID={book.WorkKey}
            userHasReviewed={userHasReviewed}
            hasReviews={hasReviews}
            onUserReviewChange={setUserHasReviewed}
            onReviewsChange={setHasReviews}
          />
        )}
      </div>
    </div>
  );
}