export type UpdateReviewVisibilityPayload = { isVisible: boolean };

export type CreateReviewPayload = {
  productId: string;
  /** Whole number, 1–5. */
  rating: number;
  /** Optional, 2000 characters max. */
  comment?: string;
};
