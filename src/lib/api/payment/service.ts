import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { Payment } from "./types";
import { PAYMENTS_TAG, paymentTag } from "./constants";

/** Filters: status, method. Read-only — there is no admin write route. */
export async function getPayments(params?: ListParams): Promise<ListResponse<Payment>> {
  return apiList<Payment>(`/admin/payments${buildQuery(params)}`, { auth: "owner", tags: [PAYMENTS_TAG], revalidate: 30 });
}

export async function getPayment(id: string) {
  return apiClient<Payment>(`/admin/payments/${id}`, { auth: "owner", tags: [paymentTag(id)], revalidate: 30 });
}
