import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { CreateDeliveryRatePayload, UpdateDeliveryRatePayload } from "./dto";
import type { DeliveryQuote, DeliveryQuoteParams, DeliveryRate } from "./types";
import { DELIVERY_RATES_TAG } from "./constants";

export async function getDeliveryRates(params?: ListParams): Promise<ListResponse<DeliveryRate>> {
  return apiList<DeliveryRate>(`/admin/delivery-rates${buildQuery(params)}`, { auth: "owner", tags: [DELIVERY_RATES_TAG], revalidate: 300 });
}

export async function createDeliveryRate(data: CreateDeliveryRatePayload) {
  return apiClient<DeliveryRate>("/admin/delivery-rates", { method: "POST", body: data, auth: "owner" });
}

export async function updateDeliveryRate(id: string, data: UpdateDeliveryRatePayload) {
  return apiClient<DeliveryRate>(`/admin/delivery-rates/${id}`, { method: "PUT", body: data, auth: "owner" });
}

export async function deleteDeliveryRate(id: string) {
  // Existing orders keep the amount they were charged.
  return apiClient<null>(`/admin/delivery-rates/${id}`, { method: "DELETE", auth: "owner" });
}

/**
 * Storefront: the shipping cost for a region and city. API key only, so
 * checkout can quote before the shopper signs in. Never cached.
 */
export async function getDeliveryQuote(params: DeliveryQuoteParams) {
  return apiClient<DeliveryQuote>(`/delivery-rates/quote${buildQuery(params)}`, { auth: "key", revalidate: false });
}
