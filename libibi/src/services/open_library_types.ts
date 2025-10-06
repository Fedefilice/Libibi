// Tipi per i risultati dell'API OpenLibrary prima della conversione
export type OpenLibraryBookResult = {
  title?: string;
  author?: string[];
  coverUrl?: string;
  rating?: number;
  authorKey?: string[];
  workKey?: string;
  firstPublishYear?: string;
  subject?: string[];
  numberOfPagesMedian?: number;
  description?: string;
};

export type OpenLibraryAuthorResult = {
  authorKey?: string;
  name?: string;
  personalName?: string;
  birthDate?: string;
  topWork?: string;
  workCount?: number;
  bio?: string;
  imageUrl?: string;
}