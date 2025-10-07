"use client";

import React, { useEffect, useState } from 'react';
import { Review, ReviewsListProps } from '@/types/review';
import ReviewDisplay from './ReviewDisplay';

// Serve per mostrare le recensioni pubbliche, eventualmente filtrate per libro

export default function ReviewsList({ bookID, limit = 6 }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const url = bookID ? `/api/review?bookId=${encodeURIComponent(bookID)}` : `/api/review/all`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Errore caricamento recensioni');
        const data = await res.json();
        setReviews(Array.isArray(data) ? data.slice(0, limit) : []);
      } catch (ex: any) {
        setError(ex?.message ?? String(ex));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookID, limit]);

  if (loading) return (
    <div className="p-8 text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[var(--color-accent)] border-t-transparent mb-2"></div>
      <p className="text-gray-500">Caricamento recensioni...</p>
    </div>
  );
  
  if (error) return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
      <p className="text-red-600">Errore: {error}</p>
    </div>
  );
  
  if (!reviews || reviews.length === 0) return (
    <div className="p-8 text-center">
      <p className="text-gray-500 text-lg">Ancora nessuna recensione per questo libro.</p>
      <p className="text-sm text-gray-400 mt-2">Sii il primo a condividere la tua opinione!</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {reviews.map(r => (
        <ReviewDisplay 
          key={r.reviewID}
          review={r}
          showBookTitle={!bookID} // Mostra il titolo del libro solo se non siamo su una pagina specifica
          showUsername={true} // Mostra sempre l'username nelle liste pubbliche
        />
      ))}
    </div>
  );
}
