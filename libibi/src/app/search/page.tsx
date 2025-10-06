"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// Definizione del tipo per i risultati di ricerca
type BookSearchResult = {
  Title: string;
  AuthorName: string[];
  CoverUrl: string | null;
  Rating: number | null;
  AuthorKey: string[];
  WorkKey: string;
};

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

      {/* Risultati della ricerca */}
      {searchResults.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 justify-items-center max-w-5xl mx-auto">
            {searchResults.map((book) => (
              <div key={book.WorkKey} className="w-full max-w-[253px] flex"> {/* 220px + 15% = 253px */}
                <div className="bg-[var(--color-card)] shadow-md overflow-hidden rounded-lg flex flex-col w-full h-full">
                  <div className="bg-gray-100 w-full">
                    {/* Area immagine con dimensioni fisse */}
                    <Link href={`/book/${encodeURIComponent(book.WorkKey)}`}>
                      <div className="w-full h-[276px] relative flex justify-center items-center"> {/* 240px + 15% = 276px */}
                        <Image 
                          src={book.CoverUrl || "/book-image.jpg"} 
                          alt={`Copertina di ${book.Title}`} 
                          fill
                          className="object-contain"
                          onError={(e) => {
                            // Fallback se l'immagine non si carica
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Previene loop infiniti
                            target.src = "/book-image.jpg";
                          }}
                        />
                      </div>
                    </Link>
                  </div>
                  
                  {/* Info libro con altezza fissa */}
                  <div className="p-6 bg-[var(--color-card)] flex flex-col flex-1">
                    <Link 
                      href={`/book/${encodeURIComponent(book.WorkKey)}`}
                      className="block text-center"
                    >
                      <h3 className="text-xl font-bold text-[var(--color-black)] mb-2 hover:underline line-clamp-2 h-[60px] flex items-center justify-center">
                        {book.Title}
                      </h3>
                    </Link>
                    <p className="text-[var(--color-accent)] mb-5 line-clamp-1 h-[28px] text-center">
                      {book.AuthorName && book.AuthorName.length > 0 
                        ? book.AuthorName.join(", ") 
                        : "Autore sconosciuto"}
                    </p>
                  </div>
                </div>
              </div>
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
      ) : hasSearched && searchResults.length === 0 ? (
        <div className="text-center mt-8">
          <p className="text-lg text-[var(--color-foreground)]">Nessun risultato trovato per "{searchQuery}".</p>
          <p className="text-sm text-gray-600 mt-2">Prova con un'altra parola chiave o verifica l'ortografia.</p>
        </div>
      ) : null}
    </div>
  );
}