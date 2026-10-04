import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { UpdateOrderStatusPayload } from "./dto";
import type { Order } from "./types";
import { ORDERS_TAG, orderTag } from "./constants";

/** Filters: status, customerId, channel. */
export async function getOrders(params?: ListParams): Promise<ListResponse<Order>> {
  return apiList<Order>(`/admin/orders${buildQuery(params)}`, { auth: "owner", tags: [ORDERS_TAG], revalidate: 30 });
}

export async function getOrder(id: string) {
  return apiClient<Order>(`/admin/orders/${id}`, { auth: "owner", tags: [orderTag(id)], revalidate: 30 });
}

/**
 * Advance an order. Illegal jumps are a 409. Moving to `delivered` fulfils the
 * stock reservation; `cancelled` releases it.
 */
export async function updateOrderStatus(id: string, data: UpdateOrderStatusPayload) {
  return apiClient<Order>(`/admin/orders/${id}/status`, { method: "PATCH", body: data, auth: "owner" });
}
