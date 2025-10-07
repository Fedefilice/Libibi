"use client";

import React, { useState } from 'react';
import { useEffect } from 'react';
import { CreateReviewProps } from '@/types/review';

export default function CreateReview({ bookID, onSuccess }: CreateReviewProps) {
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        let authHeader: string | null = null;
        if (typeof document !== 'undefined') {
          const token = getCookie('BasicAuthToken');
          if (token) authHeader = `Basic ${token}`;
        }
        if (!authHeader && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('libibi_credentials');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed?.username && parsed?.password) {
                authHeader = 'Basic ' + btoa(`${parsed.username}:${parsed.password}`);
              }
            }
          } catch (_) {}
        }
        if (!authHeader) {
          if (mounted) setAlreadyReviewed(null);
          return;
        }
        const chk = await fetch('/api/review/user', { headers: { Authorization: authHeader } });
        if (!chk.ok) return;
        const rows = await chk.json();
        const already = Array.isArray(rows) && rows.some((r: any) => r.bookID === bookID);
        if (mounted) setAlreadyReviewed(already);
      } catch (e) {
        console.error('CreateReview check error', e);
      }
    }
    check();
    return () => { mounted = false; };
  }, [bookID]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
        // Recupera header auth da cookie o localStorage
      let authHeader: string | null = null;
      if (typeof document !== 'undefined') {
        const token = getCookie('BasicAuthToken');
        if (token) authHeader = `Basic ${token}`;
      }

      if (!authHeader && typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('libibi_credentials');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.username && parsed?.password) {
              authHeader = 'Basic ' + btoa(`${parsed.username}:${parsed.password}`);
            }
          }
        } catch (_) {
          console.error('CreateReview auth parse error');
        }
      }

      if (!authHeader) {
        setError('Devi essere loggato per inserire una recensione.');
        setLoading(false);
        return;
      }

      // Verifica client-side se l'utente ha già recensito (fallback; server fa controllo definitivo)
      try {
        const chk = await fetch(`/api/review/user`, { headers: { Authorization: authHeader } });
        if (chk.ok) {
          const rows = await chk.json();
          const already = Array.isArray(rows) && rows.some((r: any) => r.bookID === bookID);
          if (already) {
            setAlreadyReviewed(true);
            setError('Hai già inserito una recensione per questo libro.');
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('CreateReview user check error', e);
      }

      const res = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader
        },
        body: JSON.stringify({ bookID, rating, reviewTitle: title, reviewText: text, parentReviewID: null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.Errore || JSON.stringify(data));
      setTitle('');
      setText('');
      setRating(5);
      onSuccess && onSuccess();
    } catch (ex: any) {
      setError(ex?.message ?? String(ex));
    } finally {
      setLoading(false);
    }
  }

  function getCookie(name: string) {
    const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return m ? decodeURIComponent(m[2]) : null;
  }

  return (
    <form onSubmit={handleSubmit} className="create-review-form">
      <div>
        <label className="block text-base font-medium text-[var(--color-foreground)] mb-2">Valutazione</label>
        <select value={rating} onChange={(e) => setRating(parseInt(e.target.value))} className="form-input text-base">
          {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} stella{v !== 1 ? 'e' : ''}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-base font-medium text-[var(--color-foreground)] mb-2">Titolo recensione</label>
        <input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          className="form-input text-base" 
          placeholder="Dai un titolo alla tua recensione..."
        />
      </div>
      <div>
        <label className="block text-base font-medium text-[var(--color-foreground)] mb-2">La tua recensione</label>
        <textarea 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          className="form-input text-base h-32" 
          placeholder="Condividi le tue impressioni sul libro..."
        />
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-full text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      <div className="pt-4">
        {alreadyReviewed ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-full text-center">
            <p className="text-yellow-800 text-sm">Hai già scritto una recensione per questo libro</p>
          </div>
        ) : (
          <button 
            type="submit" 
            disabled={loading} 
            className="btn btn-accent w-full text-lg py-3 font-medium disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Pubblica recensione'}
          </button>
        )}
      </div>
    </form>
  );
}
