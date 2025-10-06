"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBookDetails, BookDetail } from '../../../hooks/useBookDetails';
import BookCard from '../../../components/ui/BookCard';

// Componente per la sezione dei dettagli del libro
const BookDetailSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{label}</h3>
    <div className="text-gray-700">{children}</div>
  </div>
);

// Componente per la pagina del libro
export default function BookPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Utilizziamo React.use() per "unwrap" il Promise dei parametri come richiesto da Next.js 15.5.4+
  const resolvedParams = React.use(params as Promise<{ id: string }>);
  const bookId = decodeURIComponent(resolvedParams.id);
  const { book, loading, error } = useBookDetails(bookId);

  const [status, setStatus] = useState('want_to_read');
  const [adding, setAdding] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bookPresent, setBookPresent] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | null>(null);

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

  function normalizeStatusKey(s: string) {
    if (!s) return s;
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
      const credsJson = typeof window !== 'undefined' ? localStorage.getItem('libibi_credentials') : null;
      if (!credsJson) {
        alert('Devi essere loggato per aggiungere un libro alla tua libreria');
        return;
      }
      const creds = JSON.parse(credsJson);
      const auth = btoa(`${creds.username}:${creds.password}`);

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
        // Auto-dismiss dopo 5 secondi
        setTimeout(() => setFlash(null), 5000);
        return;
      }

      // Successo: mostra un messaggio inline 
  const italianStatus = statusLabelMap[normalizeStatusKey(status)] || statusLabelMap[status] || status;
      setBookPresent(true);
      setServerStatus(normalizeStatusKey(status));
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
      const credsJson = typeof window !== 'undefined' ? localStorage.getItem('libibi_credentials') : null;
      if (!credsJson) {
        setFlash({ type: 'error', text: 'Devi essere loggato per rimuovere un libro dalla tua libreria.' });
        setTimeout(() => setFlash(null), 4000);
        return;
      }
      const creds = JSON.parse(credsJson);
      const auth = btoa(`${creds.username}:${creds.password}`);
      const workKey = book?.WorkKey ?? bookId;
      const titleForMsg = book?.Title ?? bookId;
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

  // Al caricamento, controlla se questo libro è già presente nelle scaffali dell'utente
  useEffect(() => {
    async function loadShelf() {
      try {
        const credsJson = typeof window !== 'undefined' ? localStorage.getItem('libibi_credentials') : null;
        if (!credsJson) return;
        const creds = JSON.parse(credsJson);
        const auth = btoa(`${creds.username}:${creds.password}`);
        const workKey = book?.WorkKey ?? bookId;
        const res = await fetch(`/api/users/shelves?bookID=${encodeURIComponent(workKey)}`, { headers: { Authorization: `Basic ${auth}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const row = data[0];
          setBookPresent(true);
          setServerStatus(row.status ?? null);
          // Mappa lo status del server a quello del client se possibile
          const clientStatus = (row.status === 'WantToRead') ? 'want_to_read' : (row.status === 'Reading' ? 'reading' : (row.status === 'Read' ? 'finished' : 'want_to_read'));
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
        {/* Breadcrumb */}
        <nav className="mb-8 text-gray-500">
          <ol className="flex space-x-2">
            <li>
              <Link href="/" className="hover:text-[var(--color-accent)]">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/search" className="hover:text-[var(--color-accent)]">
                Ricerca
              </Link>
            </li>
            <li>/</li>
            <li className="truncate max-w-xs">
              <span className="text-[var(--color-foreground)]">{book.Title}</span>
            </li>
          </ol>
        </nav>

        {/* Contenuto principale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* BookCard per la copertina e le informazioni di base */}
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
                className="transform scale-95" // Riduzione del 5% per mantenere una dimensione simile a quella precedente
              />
            </div>
          </div>

          {/* Dettagli libro */}
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

            {/* Descrizione */}
            <BookDetailSection label="Descrizione">
              {book.Description ? (
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: book.Description }} />
              ) : (
                <p className="italic text-gray-500">Nessuna descrizione disponibile per questo libro.</p>
              )}
            </BookDetailSection>

            {/* Argomenti/Generi - mostra solo i primi 5 */}
            {book.Subject && book.Subject.length > 0 && (
              <BookDetailSection label="Argomenti">
                <div className="flex flex-wrap gap-2">
                  {book.Subject.slice(0, 5).map((subject, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {subject}
                    </span>
                  ))}
                  {book.Subject.length > 5 && (
                    <span className="text-gray-500 text-sm ml-1 self-center">
                      +{book.Subject.length - 5} altri
                    </span>
                  )}
                </div>
              </BookDetailSection>
            )}

            {/* Aggiungi alla libreria - stato, date, bottone */}
            <div className="mt-6 p-4 bg-white rounded shadow-sm max-w-md">
              <h3 className="text-lg font-medium mb-3">Aggiungi alla tua libreria</h3>
              <div className="flex items-center gap-3 mb-3">
                <label className="text-sm">Stato:</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-2">
                  <option value="want_to_read">Voglio leggerlo</option>
                  <option value="reading">Sto leggendo</option>
                  <option value="finished">Letto</option>
                </select>
              </div>

              {/* Le date sono impostate automaticamente dal server in base allo stato selezionato */}

              <div>
                {!bookPresent ? (
                  <button disabled={adding} onClick={handleAddToLibrary} className="px-6 py-3 bg-[#a86c3c] text-white rounded">
                    {adding ? 'Aggiungendo...' : 'Aggiungi alla libreria'}
                  </button>
                ) : (
                  <button onClick={handleRemoveFromLibrary} className="px-6 py-3 bg-gray-200 text-[#a86c3c] rounded border border-gray-300">Rimuovi dalla libreria</button>
                )}
              </div>
              {flash && (
                <div className={`mt-4 p-3 rounded transition-opacity duration-300 ${flash ? 'opacity-100' : 'opacity-0'} ${flash.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                  {flash.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}