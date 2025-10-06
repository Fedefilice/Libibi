"use client";

import React, { useEffect, useState } from 'react';

// Serve per mostrare le recensioni pubbliche, eventualmente filtrate per libro

type Review = {
  reviewID: string;
  bookID: string;
  bookTitle?: string | null;
  userID: number;
  username?: string | null;
  parentReviewID?: string | null;
  rating: number;
  reviewTitle?: string | null;
  reviewText?: string | null;
  reviewDate?: string | null;
};

export default function ReviewsList({ bookID, limit = 6 }: { bookID?: string | null; limit?: number }) {
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

  if (loading) return <div className="p-4 text-center text-gray-500">Caricamento recensioni...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!reviews || reviews.length === 0) return <div className="p-4 text-gray-500">Nessuna recensione disponibile.</div>;

  return (
    <div className="space-y-4">
      {reviews.map(r => (
        <article key={r.reviewID} className="p-4 bg-white shadow-sm rounded-lg border">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-[var(--color-foreground)]">{r.reviewTitle || 'Recensione'}</h4>
              <div className="text-sm text-gray-500">Valutazione: <strong className="text-[var(--color-accent)]">{r.rating}/5</strong></div>
              <div className="text-xs text-gray-400 mt-1">
                {r.username && <span className="mr-2">da <strong className="text-[var(--color-foreground)]">{r.username}</strong></span>}
                {r.bookTitle && <span>su <strong className="text-[var(--color-foreground)]">{r.bookTitle}</strong></span>}
              </div>
            </div>
            <div className="text-xs text-gray-400">{r.reviewDate ? new Date(r.reviewDate).toLocaleString() : ''}</div>
          </div>
          {r.reviewText && <p className="mt-3 text-gray-700 whitespace-pre-wrap">{r.reviewText}</p>}
        </article>
      ))}
    </div>
  );
}
