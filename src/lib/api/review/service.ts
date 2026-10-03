import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { CreateReviewPayload, UpdateReviewVisibilityPayload } from "./dto";
import type { Review } from "./types";
import { REVIEWS_TAG, productReviewsTag, reviewTag } from "./constants";

/** The moderation queue. Filters: productId, customerId, isVisible. */
export async function getReviews(params?: ListParams): Promise<ListResponse<Review>> {
  return apiList<Review>(`/admin/reviews${buildQuery(params)}`, { auth: "owner", tags: [REVIEWS_TAG], revalidate: 60 });
}

/** Everything currently hidden. */
export async function getHiddenReviews(params?: ListParams) {
  return getReviews({ ...params, isVisible: false });
}

export async function getReview(id: string) {
  return apiClient<Review>(`/admin/reviews/${id}`, { auth: "owner", tags: [reviewTag(id)], revalidate: 60 });
}

export async function deleteReview(id: string) {
  // Permanent. Prefer hiding.
  return apiClient<null>(`/admin/reviews/${id}`, { method: "DELETE", auth: "owner" });
}

export async function updateReviewVisibility(id: string, data: UpdateReviewVisibilityPayload) {
  return apiClient<Review>(`/admin/reviews/${id}/visibility`, { method: "PATCH", body: data, auth: "owner" });
}

/** Storefront read: visible reviews for a product. API key only. */
export async function getProductReviews(productId: string, params?: ListParams): Promise<ListResponse<Review>> {
  return apiList<Review>(`/reviews/product/${productId}${buildQuery(params)}`, {
    auth: "key",
    tags: [productReviewsTag(productId)],
    revalidate: 300,
  });
}

/** Storefront write: a signed-in shopper leaves a review. */
export async function createReview(data: CreateReviewPayload) {
  return apiClient<Review>("/reviews", { method: "POST", body: data, auth: "customer" });
}
