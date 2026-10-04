import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { CreateDiscountPayload, UpdateDiscountPayload } from "./dto";
import type { Discount } from "./types";
import { DISCOUNTS_TAG, discountTag } from "./constants";

export async function getDiscounts(params?: ListParams): Promise<ListResponse<Discount>> {
  return apiList<Discount>(`/admin/discounts${buildQuery(params)}`, { auth: "owner", tags: [DISCOUNTS_TAG], revalidate: 60 });
}

/** Includes redemption counts. */
export async function getDiscount(id: string) {
  return apiClient<Discount>(`/admin/discounts/${id}`, { auth: "owner", tags: [discountTag(id)], revalidate: 60 });
}

export async function createDiscount(data: CreateDiscountPayload) {
  return apiClient<Discount>("/admin/discounts", { method: "POST", body: data, auth: "owner" });
}

/**
 * There is no DELETE for discounts: retire a code with `isActive: false` so
 * its redemption history stays intact.
 */
export async function updateDiscount(id: string, data: UpdateDiscountPayload) {
  return apiClient<Discount>(`/admin/discounts/${id}`, { method: "PUT", body: data, auth: "owner" });
}
