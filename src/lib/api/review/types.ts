export type Review = {
  id: string;
  productId: string;
  customerId?: string;
  rating: number;
  comment?: string | null;
  /** Hidden reviews leave the storefront but still count toward the rating. */
  isVisible: boolean;
  /** Derived server-side from order history. */
  isVerifiedBuyer?: boolean;
  customer?: { firstName?: string; lastName?: string };
  product?: { id: string; name: string; slug?: string };
  createdAt?: string;
  updatedAt?: string;
};

export function reviewAuthor(review: Review): string {
  return [review.customer?.firstName, review.customer?.lastName].filter(Boolean).join(" ") || "Anonymous";
}

export function reviewProductName(review: Review): string {
  return review.product?.name ?? review.productId;
}
