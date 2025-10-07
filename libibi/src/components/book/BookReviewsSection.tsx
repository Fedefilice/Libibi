"use client";

import React, { useState, useEffect } from 'react';
import ReviewForm from '../reviews/ReviewForm';
import ReviewsList from '../reviews/ReviewsList';

interface BookReviewsSectionProps {
  bookID: string;
  userHasReviewed: boolean;
  hasReviews: boolean;
  onUserReviewChange: (hasReviewed: boolean) => void;
  onReviewsChange: (hasReviews: boolean) => void;
}

const BookReviewsSection: React.FC<BookReviewsSectionProps> = ({
  bookID,
  userHasReviewed,
  hasReviews,
  onUserReviewChange,
  onReviewsChange
}) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0);

  return (
    <div className="mt-16 max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Pulsante per aprire form recensione */}
        {!userHasReviewed && !showReviewForm && (
          <div className="text-center">
            <button 
              onClick={() => setShowReviewForm(true)}
              className="btn btn-accent text-xl py-3 px-8 font-medium"
            >
              Recensisci il libro
            </button>
          </div>
        )}

        {/* Form per creare recensione */}
        {showReviewForm && !userHasReviewed && (
          <ReviewForm 
            bookID={bookID} 
            onSuccess={() => {
              setReviewsRefreshKey(k => k + 1);
              setShowReviewForm(false);
              onUserReviewChange(true);
              onReviewsChange(true);
            }} 
            onCancel={() => setShowReviewForm(false)}
          />
        )}

        {/* Sezione Recensioni - Solo se ci sono recensioni */}
        {hasReviews && (
          <div className="card">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-serif text-[var(--color-foreground)] mb-2">Recensioni</h2>
              {/* Sottotitolo se l'utente ha già recensito */}
              {userHasReviewed && (
                <p className="text-gray-500 italic text-xl">Hai già recensito questo libro</p>
              )}
            </div>
            
            <ReviewsList bookID={bookID} limit={10} key={reviewsRefreshKey} />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookReviewsSection;