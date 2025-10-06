"use client";

import { useState } from "react";
import { BookSearchResult } from "@/types/book";

export function useBookSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingOpenLibrary, setLoadingOpenLibrary] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
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
    if (!searchQuery.trim()) return;
    
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

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    error,
    loading,
    hasSearched,
    loadingOpenLibrary,
    handleSearch,
    handleSearchOpenLibrary
  };
}