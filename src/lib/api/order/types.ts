import type { Address } from "@/lib/api/shared/types";

export const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = [
  "cash",
  "cod",
  "bank_transfer",
  "card",
  "esewa",
  "khalti",
  "ime_pay",
  "connect_ips",
  "fonepay",
  "prabhu_pay",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** What a shopper can pick at checkout — a subset of PAYMENT_METHODS. */
export const CHECKOUT_PAYMENT_METHODS = ["cod", "esewa", "khalti"] as const;
export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

/** Where the order came from. Chat orders carry the conversation's channel. */
export const ORDER_CHANNELS = ["facebook", "instagram", "whatsapp", "e_commerce", "pos", "manual"] as const;
export type OrderChannel = (typeof ORDER_CHANNELS)[number];

/**
 * A line item keeps a snapshot of the product as it was sold, so later
 * catalog edits never rewrite order history. Render from the snapshots.
 */
export type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  productNameSnapshot: string;
  productSkuSnapshot?: string | null;
  attributesSnapshot?: Record<string, string> | null;
  priceSnapshot: number;
};

export type OrderCustomer = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

/** Order money is numbers, unlike product prices, which are decimal strings. */
export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  channel?: OrderChannel;
  customerId?: string;
  customer?: OrderCustomer;
  items: OrderItem[];
  subtotalAmount: number;
  discountAmount?: number;
  deliveryCharge?: number;
  totalAmount: number;
  address?: Address;
  addressId?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** The happy path, in order. Transitions are validated server-side (409). */
export const ORDER_STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered"];

export function orderCustomerName(order: Order): string {
  const customer = order.customer;
  if (!customer) return "Guest";
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email || customer.phone || "Guest";
}

export function orderItemCount(order: Order): number {
  return (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  cod: "Cash on delivery",
  bank_transfer: "Bank transfer",
  card: "Card",
  esewa: "eSewa",
  khalti: "Khalti",
  ime_pay: "IME Pay",
  connect_ips: "ConnectIPS",
  fonepay: "Fonepay",
  prabhu_pay: "PrabhuPay",
};

export function paymentMethodLabel(method?: string): string {
  if (!method) return "—";
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
