"use client";

import React from 'react';
import Link from 'next/link';
import { useAuthorDetails } from '../../../../hooks/useAuthorDetails';
import Image from 'next/image';
// Componente per la sezione dei dettagli dell'autore
const AuthorDetailSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{label}</h3>
    <div className="text-gray-700">{children}</div>
  </div>
);

// Componente per la pagina dell'autore
export default function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  // Utilizziamo React.use() per "unwrap" il Promise dei parametri come richiesto da Next.js 15.5.4+
  const resolvedParams = React.use(params);
  const authorKey = decodeURIComponent(resolvedParams.id);
  const { author, loading, error } = useAuthorDetails(authorKey);

  if (loading) {
    return (
      <div className="container mx-auto px-8 py-12 flex justify-center items-center min-h-[500px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-accent)] border-t-transparent mb-4"></div>
          <p className="text-lg text-[var(--color-foreground)]">Caricamento dettagli autore...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-8 py-12">
        <div className="max-w-3xl mx-auto bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Errore</h2>
          <p className="text-gray-700">{error}</p>
          <Link 
            href="/search" 
            className="inline-block mt-6 px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-foreground)] transition-colors"
          >
            Torna alla ricerca
          </Link>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="container mx-auto px-8 py-12">
        <div className="max-w-3xl mx-auto bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Autore non trovato</h2>
          <p className="text-gray-700">Non è stato possibile trovare l'autore richiesto.</p>
          <Link 
            href="/search" 
            className="inline-block mt-6 px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-foreground)] transition-colors"
          >
            Torna alla ricerca
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-8 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Contenuto principale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Immagine autore */}
          <div className="md:col-span-1">
            <div className="flex justify-center">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-xs">
                {author.ImageUrl ? (
                  <div className="relative w-full h-96">
                    <Image
                      src={author.ImageUrl}
                      alt={author.Name || 'Autore'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 300px"
                    />
                  </div>
                ) : (
                  <div className="w-full h-96 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <svg
                      className="w-32 h-32 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-xl font-bold text-[var(--color-foreground)] mb-1">
                    {author.Name || 'Nome non disponibile'}
                  </h2>
                  {author.PersonalName && (
                    <p className="text-sm text-gray-600 mb-2">
                      {author.PersonalName}
                    </p>
                  )}
                  {author.BirthDate && (
                    <p className="text-sm text-gray-500">
                      Nato: {author.BirthDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dettagli autore */}
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-4">Dettagli</h1>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {author.WorkCount !== undefined && author.WorkCount !== null && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Numero di opere</h3>
                  <p className="text-lg">{author.WorkCount}</p>
                </div>
              )}
              
              {author.TopWork && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Opera più famosa</h3>
                  <p className="text-lg">{author.TopWork}</p>
                </div>
              )}
            </div>

            {/* Biografia */}
            <AuthorDetailSection label="Biografia">
              {author.Bio ? (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{author.Bio}</p>
                </div>
              ) : (
                <p className="italic text-gray-500">Nessuna biografia disponibile per questo autore.</p>
              )}
            </AuthorDetailSection>
          </div>
        </div>
      </div>
    </div>
  );
}
