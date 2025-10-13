// Tipo base per informazioni libro
export type BaseBook = {
  Title: string;
  AuthorName: string[];
  AuthorKey: string[];
  WorkKey: string;
};

export type BookSearchResult = BaseBook & {
  CoverUrl: string | null;
  Rating: number | null;
  isExternal?: boolean;
};

export type BookCardProps = {
  book: BookSearchResult;
  onAddToLibrary?: () => void;
  showAddButton?: boolean;
  className?: string;
};

// Definizione del tipo per i dettagli completi del libro
export type BookDetail = {
  WorkKey: string;
  Title: string;
  FirstPublishYear: string | null;
  NumberOfPagesMedian: number | null;
  Rating: number | null;
  Description: string | null;
  Subject: string[];
  CoverUrl: string | null;
  Author: string[];
  AuthorKey: string[];
};

// Tipi utility comuni
export type ApiResponse<T> = {
  success?: boolean;
  result?: T;
  Messaggio?: string;
  errore?: string;
};

export type BookDetailResponse = ApiResponse<BookDetail>;

// Tipo per dettagli autore
export type AuthorDetail = {
  AuthorKey?: string;
  Name?: string;
  PersonalName?: string;
  BirthDate?: string;
  TopWork?: string;
  WorkCount?: number;
  Bio?: string;
  ImageUrl?: string;
};
