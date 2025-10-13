"use client";

import Link from 'next/link';
import Image from 'next/image';
import { BookShelf, BookStatus } from '@/types';

interface BookShelfItemProps {
  book: BookShelf;
  showDateInfo?: 'started_reading_date' | 'finished_reading_date' | 'last_updated' | 'none';
  onRemoveBook: (bookID: string, status: BookStatus) => void;
  onChangeStatus: (bookID: string, newStatus: BookStatus) => void;
  removingBookId?: string | null;
}

const BookShelfItem = ({
  book,
  showDateInfo = 'last_updated',
  onRemoveBook,
  onChangeStatus,
  removingBookId
}: BookShelfItemProps) => {

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

  const getStatusLabel = (status: BookStatus) => {
    switch (status) {
      case 'WantToRead': return 'Voglio leggere';
      case 'Reading': return 'Sto leggendo';
      case 'Read': return 'Letto';
      case 'Abandoned': return 'Abbandonato';
      default: return status;
    }
  };

  // Mappa i valori del database ai valori del form (come in AddToLibrary)
  const statusToFormValue = (status: BookStatus) => {
    switch (status) {
      case 'WantToRead': return 'want_to_read';
      case 'Reading': return 'reading';
      case 'Read': return 'finished';
      case 'Abandoned': return 'abandoned';
      default: return status;
    }
  };

  const formValueToStatus = (formValue: string): BookStatus => {
    switch (formValue) {
      case 'want_to_read': return 'WantToRead';
      case 'reading': return 'Reading';
      case 'finished': return 'Read';
      case 'abandoned': return 'Abandoned';
      default: return 'WantToRead'; // default sicuro
    }
  };



  return (
    <div className="flex gap-6 items-stretch">
      {/* Card principale con informazioni libro */}
      <div className="flex-1 card">
        <div className="flex items-start gap-6">
          {/* Copertina del libro */}
          <div className="flex-shrink-0">
            <div className="w-20 h-28 relative">
              <Image
                src={book.coverImageURL || '/book-image.jpg'} 
                alt={book.title || book.bookID}
                fill
                className="object-cover rounded-lg shadow-md"
                sizes="80px"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/book-image.jpg';
                }}
              />
            </div>
          </div>
          
          {/* Informazioni libro */}
          <div className="flex-1 min-w-0">
            <Link 
              href={`/book/${encodeURIComponent(book.bookID)}`} 
              className="font-serif text-2xl font-semibold hover:underline text-[var(--color-foreground)] block mb-3 leading-tight"
            >
              {book.title || book.bookID}
            </Link>

            {/* Informazioni data */}
            {showDateInfo !== 'none' && (
              <div className="text-lg text-gray-500 mb-4">
                {getDateDisplay(book)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card separato per il menu a tendina */}
      <div className="w-full max-w-[253px] card">
        <div className="space-y-4">
          <div>
            <select 
              value={statusToFormValue(book.status)}
              onChange={(e) => {
                const newStatus = formValueToStatus(e.target.value);
                if (newStatus !== book.status) {
                  onChangeStatus(book.bookID, newStatus);
                }
              }}
              disabled={removingBookId === book.bookID}
              className="form-input text-lg"
            >
              <option value="want_to_read">Voglio leggerlo</option>
              <option value="reading">Sto leggendo</option>
              <option value="finished">Letto</option>
              <option value="abandoned">Abbandonato</option>
            </select>
          </div>

          <div className="pt-2">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemoveBook(book.bookID, book.status);
              }}
              disabled={removingBookId === book.bookID}
              className="btn btn-ghost w-full text-lg py-3 font-medium"
            >
              {removingBookId === book.bookID ? 'Rimozione...' : 'Rimuovi dalla libreria'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookShelfItem;