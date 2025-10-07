"use client";
import { BookShelf, BookShelfListProps } from '@/types';
import BookShelfItem from './BookShelfItem';

export default function BookShelfList({ 
  books, 
  status, 
  title, 
  loading, 
  error, 
  emptyMessage, 
  onRemoveBook,
  onChangeStatus,
  showDateInfo = 'last_updated',
  removingBookId 
}: BookShelfListProps) {
  const filteredBooks = books.filter(book => book.status === status);

  return (
    <>
      <h1 className="text-3xl font-serif border-b border-[var(--color-accent)] pb-2 mb-8 text-[var(--color-foreground)]">
        {title}
      </h1>
      {loading ? (
        <div className="text-center py-12">Caricamento libreria...</div>
      ) : error ? (
        <div className="text-center text-red-600 py-12">{error}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBooks.length === 0 && (
            <div className="text-center text-[var(--color-foreground)] py-12">{emptyMessage}</div>
          )}
          {filteredBooks.map((book) => (
            <BookShelfItem
              key={book.bookID}
              book={book}
              showDateInfo={showDateInfo}
              onRemoveBook={onRemoveBook}
              onChangeStatus={onChangeStatus}
              removingBookId={removingBookId}
            />
          ))}
        </div>
      )}
    </>
  );
}