import type { ProductMedia } from "@/lib/api/product/types";

/** The product as admin review rows join it: identity plus the primary image only. */
export type ReviewProduct = {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  media?: Pick<ProductMedia, "id" | "position" | "media">[];
};

export type ReviewCustomer = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string;
};

/**
 * Admin rows join the product (name, slug, sku, primary image) and the
 * customer. The storefront list is narrower: six fields, with no
 * `customerId` and no `isVisible`, so public reviews cannot be attributed to
 * a shopper at all.
 *
 * There is no rating aggregate anywhere in the API — no average, no count on
 * a product — so stars are computed from the list.
 */
export type Review = {
  id: string;
  productId: string;
  /** Admin rows only. */
  customerId?: string;
  /** Admin rows only. */
  product?: ReviewProduct | null;
  /** Admin rows only. */
  customer?: ReviewCustomer | null;
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

/** The product's name, or a short id when the product is missing (deleted, or a public row). */
export function reviewProductName(review: Review): string {
  return review.product?.name ?? `Product #${review.productId.slice(0, 8)}`;
}

export function reviewProductImage(review: Review): ProductMedia["media"] | undefined {
  return [...(review.product?.media ?? [])].sort((a, b) => a.position - b.position)[0]?.media ?? undefined;
}

export function reviewCustomerName(review: Review): string {
  const customer = review.customer;
  if (!customer) return review.customerId ? `Customer #${review.customerId.slice(0, 8)}` : "";
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
  return name || customer.email || `Customer #${customer.id.slice(0, 8)}`;
}
