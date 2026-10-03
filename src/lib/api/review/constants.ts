export const REVIEWS_TAG = "reviews";

export function reviewTag(id: string) {
  return `review-${id}`;
}

export function productReviewsTag(productId: string) {
  return `product-${productId}-reviews`;
}

export const REVIEW_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const REVIEW_ROUTES = {
  list: "/reviews",
};
