import { BookShelf } from './user';

export type BreadcrumbProps = {
  items: { label: string; href?: string }[];
};

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
  onRemoveBook: (bookID: string, currentStatus: string) => void;
  onChangeStatus: (bookID: string, newStatus: string) => void;
  showDateInfo?: 'last_updated' | 'started_reading_date' | 'finished_reading_date' | 'none';
  removingBookId?: string | null;
};