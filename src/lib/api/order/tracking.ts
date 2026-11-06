import "server-only";
import { apiClient } from "@/lib/api/client";
import type { OrderStatus } from "@/lib/api/order/types";

/**
 * The public tracking page's order: what the link in a chat or email shows.
 * No customer contact details — the token in the URL is the only credential.
 */
export type OrderTracking = {
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  placedAt: string;
  updatedAt: string;
  shipping: { city: string; region: string };
  totals: { subtotal: number; discount: number; delivery: number; total: number };
  items: { name: string; attributes: Record<string, string> | null; quantity: number; price: number }[];
  timeline: { status: OrderStatus; at: string }[];
};

/** Null when the token matches no order of this store. */
export async function getOrderTracking(token: string, storeHost?: string) {
  if (!/^[0-9a-f]{64}$/.test(token)) return null;
  return apiClient<OrderTracking | null>(`/storefront/orders/track/${token}`, { auth: "key", storeHost, revalidate: 30, allow404: true });
}
