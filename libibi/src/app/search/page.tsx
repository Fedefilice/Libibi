"use client";

import { useState } from "react";
import Link from "next/link";
import BookCard from "../../components/ui/BookCard";
import { BookSearchResult } from "../../types/book";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingOpenLibrary, setLoadingOpenLibrary] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      // Chiamata API per cercare i libri
      const response = await fetch(`/api/search?termineRicerca=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error(`Errore nella richiesta: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Gestione dei diversi tipi di risposta
      if (Array.isArray(data)) {
        setSearchResults(data);
        if (data.length === 0) {
          setError("Nessun risultato trovato per la tua ricerca.");
        }
      } else if (data.errore) {
        console.error("Errore API:", data.errore);
        setSearchResults([]);
        setError(`Errore dal server: ${data.errore}`);
      }
    } catch (error) {
      console.error("Errore nella ricerca:", error);
      setSearchResults([]);
      setError(`Si è verificato un errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Funzione per cercare direttamente su OpenLibrary
  const handleSearchOpenLibrary = async () => {
    setLoadingOpenLibrary(true);
    setError(null);
    // Svuota i risultati precedenti per mostrare solo quelli nuovi
    setSearchResults([]);
    
    try {
      // Chiamata API per cercare i libri su OpenLibrary
      const response = await fetch(`/api/search/openLibrary?termineRicerca=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error(`Errore nella richiesta: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Gestione dei diversi tipi di risposta
      if (Array.isArray(data)) {
        // Imposta solo i nuovi risultati
        setSearchResults(data);
        if (data.length === 0) {
          setError("Nessun risultato trovato su OpenLibrary per la tua ricerca.");
        }
      } else if (data.Messaggio) {
        setError(data.Messaggio);
      } else if (data.errore) {
        console.error("Errore API OpenLibrary:", data.errore);
        setError(`Errore dal server OpenLibrary: ${data.errore}`);
      }
    } catch (error) {
      console.error("Errore nella ricerca OpenLibrary:", error);
      setError(`Si è verificato un errore con OpenLibrary: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setLoadingOpenLibrary(false);
    }
  };

  return (
    <div className="container mx-auto px-8 py-12">
      <h1 className="text-4xl text-center font-serif mb-8 text-[var(--color-foreground)]">
        Cerca Libri
      </h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex w-full max-w-4xl mx-auto gap-4 items-center justify-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca titolo, autore, genere..."
            className="flex-1 min-w-0 w-full max-w-3xl px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="px-8 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-foreground)] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cercando...
              </span>
            ) : "Cerca"}
          </button>
        </div>
      </form>

      {/* Indicatore di caricamento durante la ricerca */}
      {loading || loadingOpenLibrary ? (
        <div className="text-center mt-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-accent)] border-t-transparent mb-4"></div>
          <p className="text-lg text-[var(--color-foreground)]">Ricerca in corso...</p>
        </div>
      ) : searchResults.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-items-center max-w-5xl mx-auto">
            {searchResults.map((book) => (
              <BookCard key={book.WorkKey} book={book} />
            ))}
          </div>
          
          {/* Bottone per cercare nuovi risultati su OpenLibrary */}
          <div className="flex justify-center mt-10 mb-4">
            <button
              onClick={handleSearchOpenLibrary}
              disabled={loadingOpenLibrary}
              className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-foreground)] transition-colors disabled:opacity-50"
            >
              {loadingOpenLibrary ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cercando...
                </span>
              ) : "Cerca su OpenLibrary"}
            </button>
          </div>
        </>
      ) : error ? (
        <div className="text-center p-4 max-w-lg mx-auto mt-8 bg-red-50 border border-red-200 rounded-md">
          <p className="var(--color-accent)">{error}</p>
          <p className="text-sm text-gray-600 mt-2">Prova a modificare i termini di ricerca o riprova più tardi.</p>
        </div>
      ) : hasSearched && !loading && !loadingOpenLibrary ? (
        <div className="text-center mt-8">
          <p className="text-lg text-[var(--color-foreground)]">Nessun risultato trovato per "{searchQuery}".</p>
          <p className="text-sm text-gray-600 mt-2">Prova con un'altra parola chiave o verifica l'ortografia.</p>
        </div>
      ) : null}
    </div>
  );
}