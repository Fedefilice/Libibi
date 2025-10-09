"use client";

import React, { useState } from 'react';
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
  const [expanded, setExpanded] = useState(false);

  const shortLimit = 320; // chars shown when collapsed
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
  const hasLongText = !!review.reviewText && review.reviewText.length > shortLimit;
  const displayedText = !hasLongText || expanded ? review.reviewText : review.reviewText?.slice(0, shortLimit) + '...';

  return (
    <article className={`bg-white dark:bg-[color:var(--color-background)] border border-gray-100 dark:border-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition ${className}`}>
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-[var(--color-background)] border border-[var(--color-accent)] flex items-center justify-center text-[var(--color-foreground)] font-medium text-lg">
            {review.username ? review.username.charAt(0).toUpperCase() : '?'}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Book title: more prominent */}
              {showBookTitle && review.bookTitle && (
                <div className="mb-1">
                  <a
                    href={`/book/${encodeURIComponent(review.bookID)}`}
                    className="text-lg md:text-xl font-serif text-[var(--color-accent)] hover:underline font-semibold block"
                  >
                    {review.bookTitle}
                  </a>
                </div>
              )}

              {/* Review title: subtler subtitle so the book title gets attention */}
              <h4 className="text-lg text-[var(--color-foreground)] mb-1 font-medium">
                {review.reviewTitle || 'Recensione'}
              </h4>

              <div className="flex items-center gap-3 text-sm text-gray-500">
                {showUsername && review.username && (
                  <span className="text-[var(--color-accent)] font-medium">{review.username}</span>
                )}
                <span>{renderStars(review.rating)}</span>
                <span className="text-gray-400">({review.rating}/5)</span>
              </div>
            </div>

            <div className="text-xs text-gray-400 ml-4">{formatDate(review.reviewDate)}</div>
          </div>

          {/* Testo della recensione */}
          {review.reviewText && (
            <div className="mt-3 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              <p>{displayedText}</p>
              {hasLongText && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-2 text-sm text-[var(--color-accent)] font-medium hover:underline"
                  aria-expanded={expanded}
                >
                  {expanded ? 'Mostra meno' : 'Mostra altro'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ReviewDisplay;