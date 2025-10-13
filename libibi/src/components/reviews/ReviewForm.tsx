"use client";

import React, { useState } from 'react';

interface ReviewFormProps {
  bookID: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ bookID, onSuccess, onCancel }) => {
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      // Recupera header auth da localStorage
      let authHeader: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('libibi_credentials');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.username && parsed?.password) {
              authHeader = 'Basic ' + btoa(`${parsed.username}:${parsed.password}`);
            }
          }
        } catch (_) {
          console.error('ReviewForm auth parse error');
        }
      }

      if (!authHeader) {
        setError('Devi essere loggato per inserire una recensione.');
        setLoading(false);
        return;
      }

      // Verifica se l'utente ha già recensito questo libro
      try {
        const chk = await fetch(`/api/review/user`, { headers: { Authorization: authHeader } });
        if (chk.ok) {
          const rows = await chk.json();
          const already = Array.isArray(rows) && rows.some((r: any) => r.bookID === bookID);
          if (already) {
            setError('Hai già inserito una recensione per questo libro.');
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('ReviewForm user check error', e);
      }

      const res = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader
        },
        body: JSON.stringify({ 
          bookID, 
          rating, 
          reviewTitle: title, 
          reviewText: text, 
          parentReviewID: null 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.Errore || JSON.stringify(data));
      
      // Reset form
      setTitle('');
      setText('');
      setRating(5);
      
      // Callback di successo
      onSuccess && onSuccess();
    } catch (ex: any) {
      setError(ex?.message ?? String(ex));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-2xl text-center font-serif text-[var(--color-foreground)] mb-2">Condividi la tua opinione con altri lettori</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xl font-medium text-[var(--color-foreground)] mb-2">
            Valutazione: 
          </label>
          <select 
            value={rating} 
            onChange={(e) => setRating(parseInt(e.target.value))} 
            className="form-input text-xl"
            required
          >
            {[5,4,3,2,1].map(v => (
              <option key={v} value={v}>{v} stell{v !== 1 ? 'e' : 'a'}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xl font-medium text-[var(--color-foreground)] mb-2">
            Titolo: 
          </label>
          <input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="form-input text-xl" 
            placeholder="Dai un titolo alla tua recensione..."
          />
        </div>

        <div>
          <label className="block text-xl font-medium text-[var(--color-foreground)] mb-2">
            La tua recensione: 
          </label>
          <textarea 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-xl h-32 resize-none focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)] focus:ring-opacity-12" 
            placeholder="Condividi le tue impressioni sul libro..."
            spellCheck={false}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-full text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button 
            type="submit" 
            disabled={loading} 
            className="btn btn-accent flex-1 text-lg py-3 font-medium disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Pubblica recensione'}
          </button>
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              disabled={loading}
              className="btn btn-ghost px-6 py-3 font-medium disabled:opacity-50"
            >
              Annulla
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;