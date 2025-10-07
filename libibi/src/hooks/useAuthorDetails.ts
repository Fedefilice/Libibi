import { useState, useEffect } from 'react';
import { AuthorDetail } from '@/types/book';

export function useAuthorDetails(authorKey: string) {
  const [author, setAuthor] = useState<AuthorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthorDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/author/details?authorKey=${encodeURIComponent(authorKey)}`);
        
        if (!response.ok) {
          throw new Error(`Errore HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setAuthor(data);
      } catch (err) {
        console.error('Errore nel recupero dei dettagli dell\'autore:', err);
        setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      } finally {
        setLoading(false);
      }
    };

    if (authorKey) {
      fetchAuthorDetails();
    }
  }, [authorKey]);

  return { author, loading, error };
}
