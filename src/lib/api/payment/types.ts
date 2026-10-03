import type { PaymentMethod } from "@/lib/api/order/types";

export const PAYMENT_STATUSES = ["pending", "authorized", "captured", "failed", "refunded", "partially_refunded", "cancelled"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Read-only: the API owns payment state, and the gateways own the money. */
export type Payment = {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerId?: string;
  status: PaymentStatus;
  method: PaymentMethod;
  amount: number;
  /** Gateway reference, kept for reconciliation. */
  transactionId?: string | null;
  gatewayReference?: string | null;
  /** The gateway's raw response, as stored. */
  gatewayResponse?: Record<string, unknown> | null;
  failureReason?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export { paymentMethodLabel } from "@/lib/api/order/types";
