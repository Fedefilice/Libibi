"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useBookDetails, BookDetail } from '../../../../hooks/useBookDetails';
import BookCard from '../../../../components/ui/BookCard';

// Componente per la sezione dei dettagli del libro
const BookDetailSection = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-2">{label}</h3>
    <div className="text-gray-700">{children}</div>
  </div>
);

// Componente per la pagina del libro
export default function BookPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Utilizziamo React.use() per "unwrap" il Promise dei parametri come richiesto da Next.js 15.5.4+
  const resolvedParams = React.use(params as Promise<{ id: string }>);
  const bookId = decodeURIComponent(resolvedParams.id);
  const { book, loading, error } = useBookDetails(bookId);

  if (loading) {
    return (
      <div className="container mx-auto px-8 py-12 flex justify-center items-center min-h-[500px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-accent)] border-t-transparent mb-4"></div>
          <p className="text-lg text-[var(--color-foreground)]">Caricamento dettagli libro...</p>
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
            href="/data/search" 
            className="inline-block mt-6 px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-foreground)] transition-colors"
          >
            Torna alla ricerca
          </Link>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container mx-auto px-8 py-12">
        <div className="max-w-3xl mx-auto bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Libro non trovato</h2>
          <p className="text-gray-700">Non è stato possibile trovare il libro richiesto.</p>
          <Link 
            href="/data/search" 
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
        {/* Breadcrumb */}
        <nav className="mb-8 text-gray-500">
          <ol className="flex space-x-2">
            <li>
              <Link href="/" className="hover:text-[var(--color-accent)]">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/data/search" className="hover:text-[var(--color-accent)]">
                Ricerca
              </Link>
            </li>
            <li>/</li>
            <li className="truncate max-w-xs">
              <span className="text-[var(--color-foreground)]">{book.Title}</span>
            </li>
          </ol>
        </nav>

        {/* Contenuto principale */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* BookCard per la copertina e le informazioni di base */}
          <div className="md:col-span-1">
            <div className="flex justify-center">
              <BookCard 
                book={{
                  Title: book.Title,
                  AuthorName: book.Author,
                  CoverUrl: book.CoverUrl,
                  Rating: book.Rating,
                  AuthorKey: book.AuthorKey,
                  WorkKey: book.WorkKey
                }}
                showAddButton={false}
                className="transform scale-95" // Riduzione del 5% per mantenere una dimensione simile a quella precedente
              />
            </div>
          </div>

          {/* Dettagli libro */}
          <div className="md:col-span-2">
            <h1 className="text-3xl font-bold text-[var(--color-foreground)] mb-4">Dettagli</h1>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              {book.FirstPublishYear && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Anno di pubblicazione</h3>
                  <p className="text-lg">{book.FirstPublishYear}</p>
                </div>
              )}
              
              {book.NumberOfPagesMedian && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Numero di pagine</h3>
                  <p className="text-lg">{book.NumberOfPagesMedian}</p>
                </div>
              )}
              
              {book.Rating && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Valutazione</h3>
                  <p className="text-lg">{book.Rating.toFixed(1)}/5</p>
                </div>
              )}
            </div>

            {/* Descrizione */}
            <BookDetailSection label="Descrizione">
              {book.Description ? (
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: book.Description }} />
              ) : (
                <p className="italic text-gray-500">Nessuna descrizione disponibile per questo libro.</p>
              )}
            </BookDetailSection>

            {/* Argomenti/Generi - mostra solo i primi 5 */}
            {book.Subject && book.Subject.length > 0 && (
              <BookDetailSection label="Argomenti">
                <div className="flex flex-wrap gap-2">
                  {book.Subject.slice(0, 5).map((subject, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </BookDetailSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}