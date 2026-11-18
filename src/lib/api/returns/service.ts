import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { OrderReturn, OrderReturnsSummary, ReturnType } from "./types";
import { RETURNS_TAG, orderReturnsTag } from "./constants";

/** Filters: status, type, orderId, customerId; `search` matches the return or order number. */
export async function getReturns(params?: ListParams): Promise<ListResponse<OrderReturn>> {
  return apiList<OrderReturn>(`/admin/returns${buildQuery(params)}`, { auth: "owner", tags: [RETURNS_TAG], revalidate: 15 });
}

export async function getOrderReturns(orderId: string) {
  return apiClient<OrderReturnsSummary>(`/admin/returns/order/${orderId}`, { auth: "owner", tags: [orderReturnsTag(orderId)] });
}

export type ReturnLinePayload = { orderItemId: string; quantity: number; replacementProductId?: string };

export type RefundFields = {
  refundAmount?: number;
  refundMethod?: string;
  refundReference?: string;
  restock?: boolean;
  adminNote?: string;
};

export type CreateReturnPayload = RefundFields & {
  orderId: string;
  type: ReturnType;
  items: ReturnLinePayload[];
  reason: string;
  /** Restock, refund and ship replacements now instead of leaving it approved. */
  complete?: boolean;
};

export async function createReturn(data: CreateReturnPayload) {
  return apiClient<OrderReturn>("/admin/returns", { method: "POST", body: data, auth: "owner" });
}

export async function approveReturn(id: string, note?: string) {
  return apiClient<OrderReturn>(`/admin/returns/${id}/approve`, { method: "POST", body: { note }, auth: "owner" });
}

export async function rejectReturn(id: string, note?: string) {
  return apiClient<OrderReturn>(`/admin/returns/${id}/reject`, { method: "POST", body: { note }, auth: "owner" });
}

/** Goods are back: restock, refund and ship replacements, atomically. */
export async function completeReturn(id: string, data: RefundFields) {
  return apiClient<OrderReturn>(`/admin/returns/${id}/complete`, { method: "POST", body: data, auth: "owner" });
}
