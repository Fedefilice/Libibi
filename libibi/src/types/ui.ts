import { BookShelf, BookStatus } from './user';

export type SearchBarProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  handleSearch: (e: React.FormEvent) => void;
};

export type BookShelfListProps = {
  books: BookShelf[];
  status: string;
  title: string;
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  onRemoveBook: (bookID: string, currentStatus: BookStatus) => void;
  onChangeStatus: (bookID: string, newStatus: BookStatus) => void;
  showDateInfo?: 'last_updated' | 'started_reading_date' | 'finished_reading_date' | 'none';
  removingBookId?: string | null;
};