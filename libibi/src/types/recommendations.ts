// Tipi per le raccomandazioni e l'integrazione LLM
import { BookSearchResult } from './book';
import { BookStatus } from './user';

// Unifichiamo con BookSearchResult per evitare duplicazioni
export interface UserBook extends Omit<BookSearchResult, 'Rating' | 'CoverUrl' | 'isExternal'> {
  // Campi specifici per UserBook se necessari
}

export interface CategorizedBooks {
  read: UserBook[];
  reading: UserBook[];
  wantToRead: UserBook[];
  abandoned: UserBook[];
}

export interface DatabaseBook {
  title: string;
  authors: string | null;
  status: BookStatus;
  last_updated: Date;
}

export interface DatabaseSearchResult {
  authorID: number;
  authorName: string;
  bookID: string;
  title: string;
  coverImageURL: string | null;
  averageRating: number | null;
}

export interface LLMResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}