"use client";

// Serve per mostrare le recensioni scritte dall'utente loggato

import React, { useEffect, useState } from 'react';
import { Review } from '@/types/review';

export default function UserReviewsList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function getAuthHeader() {
    try {
      const credsJson = localStorage.getItem('libibi_credentials');
      if (!credsJson) return null;
      const creds = JSON.parse(credsJson);
      const token = btoa(`${creds.username}:${creds.password}`);
      return `Basic ${token}`;
    } catch (e) {
      return null;
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const auth = getAuthHeader();
        if (!auth) {
          setReviews([]);
          setLoading(false);
          return;
        }
        const res = await fetch('/api/review/user', { headers: { Authorization: auth } });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err?.Errore || `Errore ${res.status}`);
          setReviews([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      } catch (ex: any) {
        setError(String(ex?.message ?? ex));
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-4 text-center text-gray-500">Caricamento recensioni...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!reviews || reviews.length === 0) return <div className="p-4 text-gray-500">Non hai ancora scritto recensioni.</div>;

  return (
    <div className="space-y-4">
      {reviews.map(r => (
        <article key={r.reviewID} className="p-4 bg-white shadow-sm rounded-lg border">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-[var(--color-foreground)]">{r.reviewTitle || 'Recensione'}</h4>
              <div className="text-sm text-gray-500">Valutazione: <strong className="text-[var(--color-accent)]">{r.rating}/5</strong></div>
              <div className="text-xs text-gray-400 mt-1">{r.bookTitle && <span>su <strong>{r.bookTitle}</strong></span>}</div>
            </div>
            <div className="text-xs text-gray-400">{r.reviewDate ? new Date(r.reviewDate).toLocaleString() : ''}</div>
          </div>
          {r.reviewText && <p className="mt-3 text-gray-700 whitespace-pre-wrap">{r.reviewText}</p>}
        </article>
      ))}
    </div>
  );
}
