"use client";

// Serve per mostrare le recensioni scritte dall'utente loggato

import React, { useEffect, useState } from 'react';
import { Review } from '@/types/review';
import ReviewDisplay from './ReviewDisplay';

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
      <p className="text-gray-500 text-lg">Non hai ancora scritto recensioni.</p>
      <p className="text-sm text-gray-400 mt-2">Inizia a condividere le tue opinioni sui libri!</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {reviews.map(r => (
        <ReviewDisplay 
          key={r.reviewID}
          review={r}
          showBookTitle={true} // Mostra sempre il titolo del libro nelle recensioni dell'utente
          showUsername={false} // Non mostrare l'username perché sono le recensioni dell'utente stesso
        />
      ))}
    </div>
  );
}
