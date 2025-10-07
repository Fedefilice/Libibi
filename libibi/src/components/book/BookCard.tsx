import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookCardProps } from '@/types/book';

const BookCard: React.FC<BookCardProps> = ({
  book,
  onAddToLibrary,
  showAddButton = true,
  className = '',
}) => {
  return (
    <div className={`w-full max-w-[253px] flex ${className}`}>
      <div className="bg-[var(--color-card)] shadow-md rounded-lg overflow-hidden w-full flex flex-col">
        <div className="bg-gray-100 w-full">
          <Link href={`/book/${encodeURIComponent(book.WorkKey)}`}>
            <div className="w-full h-[276px] relative flex justify-center items-center">
              <Image
                src={book.CoverUrl || "/book-image.jpg"}
                alt={`Copertina di ${book.Title}`}
                fill
                sizes="253px"
                className="object-contain"
                onError={(e) => {
                  // Fallback se l'immagine non si carica
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; // Previene loop infiniti
                  target.src = "/book-image.jpg";
                }}
              />
            </div>
          </Link>
        </div>

        <div className="p-6 bg-[var(--color-card)] flex flex-col flex-1">
          <Link href={`/book/${encodeURIComponent(book.WorkKey)}`} className="block text-center">
            <h3 className="text-xl font-bold text-[var(--color-black)] mb-3 hover:underline line-clamp-2 h-[60px] flex items-center justify-center" title={book.Title}>
              {book.Title}
            </h3>
          </Link>

          <p className="text-base text-[var(--color-accent)] mb-4 line-clamp-1 text-center">
            {book.AuthorName && book.AuthorName.length > 0
              ? book.AuthorName.map((authorName, index) => (
                  <span key={index}>
                    {index > 0 && ", "}
                    {book.AuthorKey && book.AuthorKey[index] ? (
                      <Link href={`/author/${encodeURIComponent(book.AuthorKey[index])}`} className="hover:underline">
                        {authorName}
                      </Link>
                    ) : (
                      authorName
                    )}
                  </span>
                ))
              : "Autore sconosciuto"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookCard;