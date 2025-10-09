"use client";

import React, { useEffect, useState } from 'react';
import { Review, ReviewsListProps } from '@/types/review';
import ReviewDisplay from './ReviewDisplay';

// Serve per mostrare le recensioni pubbliche, eventualmente filtrate per libro

export default function ReviewsList({ bookID, limit = 6 }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(limit);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const url = bookID ? `/api/review?bookId=${encodeURIComponent(bookID)}` : `/api/review/all`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Errore caricamento recensioni');
        const data = await res.json();
        // keep all reviews client-side, we'll control how many to show via visibleCount
        setReviews(Array.isArray(data) ? data : []);
      } catch (ex: any) {
        setError(ex?.message ?? String(ex));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookID, limit]);

  // reset visibleCount when bookID or limit changes
  useEffect(() => {
    setVisibleCount(limit);
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
    <section>
      <header className="mb-6 flex items-center justify-between">
        <p className="text-lg font-serif text-[var(--color-foreground)]">Leggi le opinioni della community</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reviews.slice(0, visibleCount).map(r => (
          <ReviewDisplay 
            key={r.reviewID}
            review={r}
            showBookTitle={!bookID} // Mostra il titolo del libro solo se non siamo su una pagina specifica
            showUsername={true} // Mostra sempre l'username nelle liste pubbliche
          />
        ))}
      </div>

      {/* Controls to load more or collapse */}
      {reviews.length > visibleCount && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setVisibleCount((c) => Math.min(reviews.length, c + limit))}
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded hover:opacity-90"
          >
            Carica altre recensioni
          </button>
        </div>
      )}

      {reviews.length > limit && visibleCount >= reviews.length && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setVisibleCount(limit)}
            className="px-3 py-1 text-sm text-gray-600 hover:underline"
          >
            Mostra meno
          </button>
        </div>
      )}
    </section>
  );
}
