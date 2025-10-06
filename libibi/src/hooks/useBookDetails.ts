"use client";

import { useState, useEffect } from 'react';

// Definizione del tipo per i dettagli completi del libro
export interface BookDetail {
  WorkKey: string;
  Title: string;
  FirstPublishYear: string | null;
  NumberOfPagesMedian: number | null;
  Rating: number | null;
  Description: string | null;
  Subject: string[];
  CoverUrl: string | null;
  Author: string[];
  AuthorKey: string[];
}

interface BookDetailResponse {
  success?: boolean;
  result?: BookDetail;
  Messaggio?: string;
  errore?: string;
}

/**
 * Hook per recuperare i dettagli di un libro specificato dall'ID
 */
export function useBookDetails(bookId: string) {
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBookDetails() {
      if (!bookId) {
        setLoading(false);
        setError('ID libro non specificato');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/book/details?bookId=${encodeURIComponent(bookId)}`);
        
        if (!response.ok) {
          throw new Error(`Errore nella richiesta: ${response.status} ${response.statusText}`);
        }
        
        const data: BookDetailResponse = await response.json();
        
        if (data.errore) {
          throw new Error(data.errore);
        }

        if (data.Messaggio) {
          throw new Error(data.Messaggio);
        }

        // Se abbiamo una risposta success=true, usiamo result, altrimenti usiamo l'intero oggetto dati
        const bookData = data.success && data.result ? data.result : data as unknown as BookDetail;
        
        setBook(bookData);
      } catch (error) {
        console.error('Errore nel recupero dei dettagli del libro:', error);
        setError(error instanceof Error ? error.message : 'Si è verificato un errore durante il recupero dei dettagli del libro');
      } finally {
        setLoading(false);
      }
    }

    fetchBookDetails();
  }, [bookId]);

  return { book, loading, error };
}