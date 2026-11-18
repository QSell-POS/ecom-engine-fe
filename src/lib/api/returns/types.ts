import type { Decimal } from "@/lib/api/shared/types";
import type { OrderChannel, OrderItem, OrderStatus, PaymentMethod } from "@/lib/api/order/types";

/**
 * Returns, refunds and exchanges (RMAs) on delivered orders.
 *
 * requested ─┬─> approved ──> completed
 *            ├─> rejected
 *            └─> cancelled (the shopper withdrew it)
 *
 * Stock, money and replacements only move on `completed`, in one transaction
 * on the API: returned units are restocked (unless written off), the refund is
 * recorded on the order and its payments, and exchange replacements leave
 * stock. A return the store opens itself starts at `approved`.
 */
export const RETURN_TYPES = ["return_refund", "exchange"] as const;
export type ReturnType = (typeof RETURN_TYPES)[number];

export const RETURN_STATUSES = ["requested", "approved", "rejected", "completed", "cancelled"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

export const RETURN_TYPE_LABELS: Record<ReturnType, string> = {
  return_refund: "Return & refund",
  exchange: "Exchange",
};

export const RETURN_STATUS_META: Record<ReturnStatus, { label: string; tone: "warning" | "info" | "danger" | "success" | "neutral" }> = {
  requested: { label: "Requested", tone: "warning" },
  approved: { label: "Approved", tone: "info" },
  rejected: { label: "Rejected", tone: "danger" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

/** Reasons offered in forms; the API takes any short text. */
export const RETURN_REASONS = [
  "Wrong size or fit",
  "Damaged or defective",
  "Not as described",
  "Wrong item received",
  "Changed my mind",
  "Other",
] as const;

export type OrderReturnItem = {
  id: string;
  orderItemId: string;
  productId: string | null;
  productNameSnapshot: string;
  quantity: number;
  unitPrice: Decimal | number;
  replacementProductId?: string | null;
  replacementNameSnapshot?: string | null;
  replacementUnitPrice?: Decimal | number | null;
};

export type OrderReturn = {
  id: string;
  returnNumber: string;
  orderId: string;
  customerId: string;
  type: ReturnType;
  status: ReturnStatus;
  source: "customer" | "admin";
  reason: string;
  customerNote?: string | null;
  adminNote?: string | null;
  photoUrls?: string[];
  restock: boolean;
  /** Value of the returned lines, net of the order's discount. */
  returnedValue: Decimal | number;
  replacementValue: Decimal | number;
  refundAmount: Decimal | number;
  /** Exchange: what the customer still owes for a pricier replacement. */
  amountDue: Decimal | number;
  refundMethod?: PaymentMethod | string | null;
  refundReference?: string | null;
  handledByName?: string | null;
  resolvedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: OrderReturnItem[];
  /** Present on admin reads. */
  order?: {
    id: string;
    orderNumber: string;
    channel?: OrderChannel;
    status?: OrderStatus;
    totalAmount?: Decimal | number;
    refundedAmount?: Decimal | number;
    paymentMethod?: PaymentMethod;
    customer?: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null; phone?: string | null } | null;
  };
};

export type ReturnEligibility = {
  eligible: boolean;
  reason: string | null;
  /** Last day a shopper may ask (storefront orders). */
  until: string | null;
  /** Units still returnable per order line id. */
  remaining: Record<string, number>;
};

/** The admin order view's returns panel. */
export type OrderReturnsSummary = {
  returns: OrderReturn[];
  items: OrderItem[];
  refundedAmount: number;
  eligibility: ReturnEligibility;
};

export function returnCustomerName(rma: OrderReturn): string {
  const customer = rma.order?.customer;
  if (!customer) return "";
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email || customer.phone || "";
}

export function returnItemCount(rma: OrderReturn): number {
  return rma.items.reduce((sum, item) => sum + item.quantity, 0);
}
