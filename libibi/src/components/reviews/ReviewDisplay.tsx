"use client";

import React from 'react';
import { Review } from '@/types/review';

interface ReviewDisplayProps {
  review: Review;
  showBookTitle?: boolean; // Mostra il titolo del libro (per liste di recensioni generali)
  showUsername?: boolean; // Mostra l'username (per recensioni pubbliche)
  className?: string; // Classi CSS personalizzate
}

const ReviewDisplay: React.FC<ReviewDisplayProps> = ({
  review,
  showBookTitle = false,
  showUsername = true,
  className = ""
}) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch {
      return '';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <span className="text-yellow-500 text-lg">
        {'★'.repeat(Math.max(0, Math.min(5, rating)))}
        {'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, rating))))}
      </span>
    );
  };

  return (
    <article className={`border-b border-gray-200 pb-6 last:border-b-0 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Titolo della recensione */}
          <h4 className="text-2xl font-serif text-[var(--color-foreground)] mb-3 font-semibold">
            {review.reviewTitle || 'Recensione'}
          </h4>
          
          {/* Titolo del libro (se richiesto) */}
          {showBookTitle && review.bookTitle && (
            <div className="mb-2">
              <a 
                href={`/book/${encodeURIComponent(review.bookID)}`}
                className="text-lg text-[var(--color-accent)] hover:underline font-medium"
              >
                {review.bookTitle}
              </a>
            </div>
          )}
          
          {/* Rating e username */}
          <div className="flex items-center gap-4 text-base">
            <div className="flex items-center gap-2">
              {showUsername && review.username && (
                <span className="text-gray-600">
                  <strong className="text-[var(--color-accent)]">{review.username}</strong>
                </span>
              )}
              {renderStars(review.rating)}
              <span className="text-gray-600">({review.rating}/5)</span>
            </div>
          </div>
        </div>
        
        {/* Data della recensione */}
        <div className="text-sm text-gray-400 ml-4">
          {formatDate(review.reviewDate)}
        </div>
      </div>
      
      {/* Testo della recensione */}
      {review.reviewText && (
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {review.reviewText}
          </p>
        </div>
      )}
    </article>
  );
};

export default ReviewDisplay;