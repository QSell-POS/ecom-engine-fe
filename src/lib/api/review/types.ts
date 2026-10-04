/**
 * Neither review route joins a product or a customer, so a name has to be
 * resolved from the ids yourself. The storefront list is narrower still: six
 * fields, with no `customerId` and no `isVisible`, so public reviews cannot
 * be attributed to a shopper at all.
 *
 * There is no rating aggregate anywhere in the API — no average, no count on
 * a product — so stars are computed from the list.
 */
export type Review = {
  id: string;
  productId: string;
  /** Admin rows only. */
  customerId?: string;
  rating: number;
  comment?: string | null;
  /** Admin rows only; hiding removes it from the storefront list. */
  isVisible?: boolean;
  /** Always true on anything created through the API: only buyers may review. */
  isVerifiedBuyer?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export function averageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10;
}
