import React from 'react';
import ReviewsList from '@/components/ui/ReviewsList';

export const metadata = {
  title: 'Recensioni - Libibi'
};

export default function ReviewsPage() {
  return (
    <div className="container mx-auto px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Recensioni pubbliche</h1>
        </div>

        <p className="text-gray-600 mb-6">Qui trovi tutte le recensioni pubblicate dagli utenti. Se ti serve la recensione di un libro in particolare, cercalo sopra e vedrai tutte le recensioni inerenti.</p>
        <p className="text-gray-600 mb-6">Il team di Libibi ti augura una buona lettura!</p>

        <ReviewsList limit={1000} />
      </div>
    </div>
  );
}
