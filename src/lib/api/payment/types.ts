import type { Decimal } from "@/lib/api/shared/types";
import type { Order, PaymentMethod } from "@/lib/api/order/types";

export const PAYMENT_STATUSES = ["pending", "authorized", "captured", "failed", "refunded", "partially_refunded", "cancelled"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * Read-only: the API owns payment state and the gateways own the money. An
 * order can hold several rows once a shopper has retried, and `rawResponse`
 * keeps every issued pidx or correlation id so earlier links stay verifiable.
 */
export type Payment = {
  id: string;
  orderId: string;
  /** Decimal string. */
  amount: Decimal;
  status: PaymentStatus;
  method: PaymentMethod;
  gateway?: string | null;
  transactionId?: string | null;
  gatewayPaymentId?: string | null;
  /** The whole gateway payload, as stored. */
  rawResponse?: Record<string, unknown> | null;
  notes?: string | null;
  paidAt?: string | null;
  /** Present on the detail route only. */
  order?: Order;
  createdAt?: string;
  updatedAt?: string;
};
