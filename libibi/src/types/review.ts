export type Review = {
  reviewID: string;
  bookID: string;
  bookTitle?: string | null;
  userID?: number;
  username?: string | null;
  parentReviewID?: string | null;
  rating: number;
  reviewTitle?: string | null;
  reviewText?: string | null;
  reviewDate?: string | null;
};

export type CreateReviewProps = {
  bookID: string;
  onSuccess?: () => void;
};

export type ReviewsListProps = {
  bookID?: string | null;
  limit?: number;
};

// Tipo per input delle recensioni (API)
export type ReviewInput = {
  bookID: string;
  parentReviewID?: string | null;
  rating: number;
  reviewTitle?: string | null;
  reviewText?: string | null;
};