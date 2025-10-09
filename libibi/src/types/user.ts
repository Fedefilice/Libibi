export type User = {
  Id?: number;
  Nome?: string | null;
  Cognome?: string | null;
  Username?: string | null;
  Email?: string | null;
  Admin?: boolean;
};

export type MenuTab = 'voglio-leggere' | 'sto-leggendo' | 'letto' | 'abbandonato' | 'impostazioni' | 'recensioni';

export type BookShelf = {
  bookID: string;
  title?: string;
  coverImageURL?: string;
  status: 'WantToRead' | 'Reading' | 'Read' | 'Abandoned';
  last_updated?: string;
  started_reading_date?: string;
  finished_reading_date?: string;
};

export type ConfirmRemovalState = {
  bookID: string;
  status: string;
  title: string;
};

// Tipo per record utente nel database (con userID invece di Id e campi obbligatori)
export type UserRecord = {
  userID: number;
  nome: string | null;
  cognome: string | null;
  username: string | null;
  email: string | null;
  passwd: string | null;
  admin: boolean;
};