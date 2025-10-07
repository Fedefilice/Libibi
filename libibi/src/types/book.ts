export type BookSearchResult = {
  Title: string;
  AuthorName: string[];
  CoverUrl: string | null;
  Rating: number | null;
  AuthorKey: string[];
  WorkKey: string;
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

export type BookDetailResponse = {
  success?: boolean;
  result?: BookDetail;
  Messaggio?: string;
  errore?: string;
};

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
