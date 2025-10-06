import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export type BookCardProps = {
  book: {
    Title: string;
    AuthorName: string[];
    CoverUrl: string | null;
    Rating: number | null;
    AuthorKey?: string[];
    WorkKey: string;
    isExternal?: boolean;
  };
  onAddToLibrary?: () => void;
  showAddButton?: boolean;
  className?: string;
};

const BookCard: React.FC<BookCardProps> = ({
  book,
  onAddToLibrary,
  showAddButton = true,
  className = '',
}) => {
  return (
    <div className={`w-full max-w-[253px] flex ${className}`}>
      <div className="bg-[var(--color-card)] shadow-md rounded-lg overflow-hidden w-full flex flex-col">
        <Link href={`/book/${book.WorkKey}`} className="block h-[276px] relative overflow-hidden">
          {book.CoverUrl ? (
            <Image 
              src={book.CoverUrl} 
              alt={`Copertina di ${book.Title}`}
              fill
              sizes="253px"
              className="object-cover"
            />
          ) : (
            <Image 
              src="/placeholder-book.jpg" 
              alt="Copertina non disponibile"
              fill
              sizes="253px"
              className="object-cover"
            />
          )}
        </Link>
        
        <div className="p-4 flex flex-col flex-grow">
          <Link href={`/book/${book.WorkKey}`}>
            <h3 className="text-xl font-bold mb-2 line-clamp-2 h-[64px]" title={book.Title}>
              {book.Title}
            </h3>
          </Link>
          
          <p className="text-sm text-gray-600 mb-4 line-clamp-1">
            {book.AuthorName && book.AuthorName.join(', ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookCard;