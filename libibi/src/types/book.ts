export type BookSearchResult = {
  Title: string;
  AuthorName: string[];
  CoverUrl: string | null;
  Rating: number | null;
  AuthorKey: string[];
  WorkKey: string;
  isExternal?: boolean;
};
