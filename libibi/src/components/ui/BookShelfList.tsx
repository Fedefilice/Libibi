"use client";
import { BookShelf, BookShelfListProps } from '@/types';

export default function BookShelfList({ 
  books, 
  status, 
  title, 
  loading, 
  error, 
  emptyMessage, 
  onRemoveBook,
  showDateInfo = 'last_updated',
  removingBookId 
}: BookShelfListProps) {
  const filteredBooks = books.filter(book => book.status === status);

  const getDateDisplay = (book: BookShelf) => {
    switch (showDateInfo) {
      case 'started_reading_date':
        return book.started_reading_date 
          ? `Iniziato: ${new Date(book.started_reading_date).toLocaleDateString()}` 
          : 'Iniziato: -';
      case 'finished_reading_date':
        return book.finished_reading_date 
          ? `Finito: ${new Date(book.finished_reading_date).toLocaleDateString()}` 
          : 'Finito: -';
      case 'last_updated':
        return book.last_updated 
          ? new Date(book.last_updated).toLocaleString() 
          : '';
      case 'none':
      default:
        return '';
    }
  };

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
            <div key={book.bookID} className="flex items-center gap-4 p-4 bg-[var(--color-background)] rounded">
              <img 
                src={book.coverImageURL || '/book-image.jpg'} 
                alt={book.title || book.bookID} 
                className="w-16 h-20 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/book-image.jpg';
                }}
              />
              <div className="flex-1">
                <a 
                  href={`/data/book/${encodeURIComponent(book.bookID)}`} 
                  className="font-medium hover:underline text-[var(--color-foreground)]"
                >
                  {book.title || book.bookID}
                </a>
                {showDateInfo !== 'none' && (
                  <div className="text-sm text-gray-500 mt-1">
                    {getDateDisplay(book)}
                  </div>
                )}
              </div>
              <div>
                <button 
                  onClick={() => onRemoveBook(book.bookID, book.status)} 
                  disabled={removingBookId === book.bookID}
                  className={`px-3 py-2 rounded transition-colors ${
                    removingBookId === book.bookID
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                  aria-label={`Rimuovi ${book.title || book.bookID} da ${title}`}
                >
                  {removingBookId === book.bookID ? 'Rimozione...' : 'Rimuovi'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}