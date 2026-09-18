export interface ICreateReview {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface IUpdateReview {
  rating?: number;
  comment?: string;
}

export interface IReviewQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
