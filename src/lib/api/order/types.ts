import type { Decimal } from "@/lib/api/shared/types";

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

/** What a shopper may pick at checkout. Chat orders accept the full enum. */
export const CHECKOUT_PAYMENT_METHODS = ["cod", "esewa", "khalti"] as const;
export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

export const ORDER_CHANNELS = ["facebook", "instagram", "whatsapp", "e_commerce", "pos", "manual"] as const;
export type OrderChannel = (typeof ORDER_CHANNELS)[number];

/**
 * What each status may become. An illegal jump is a 400
 * (INVALID_STATUS_TRANSITION), so the dashboard only offers these.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "shipped", "delivered", "cancelled"],
  processing: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Sold as it was: later catalog edits never rewrite these. */
export type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  productNameSnapshot: string;
  productSkuSnapshot?: string | null;
  attributesSnapshot?: Record<string, string> | null;
  /** Number when freshly computed, decimal string when read back. */
  priceSnapshot: Decimal | number;
};

/** Derived by the API from the order's payment attempts (and, for COD, its delivery). */
export const ORDER_PAYMENT_STATUSES = ["paid", "unpaid", "pending", "failed", "refunded", "partially_refunded"] as const;
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

/** The customer fields the admin order routes embed. */
export type OrderCustomer = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  phone?: string | null;
};

/**
 * Money here is a number in the checkout response and a decimal string on
 * every later read of the same order, because the columns have no transformer.
 * Always put it through `toAmount()`.
 *
 * The admin routes embed `customer` and `paymentStatus`; the shopper's own
 * order routes carry neither.
 */
export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  channel?: OrderChannel;
  customerId?: string;
  customer?: OrderCustomer | null;
  paymentStatus?: OrderPaymentStatus;
  items?: OrderItem[];
  subtotalAmount: Decimal | number;
  discountAmount?: Decimal | number;
  deliveryCharge?: Decimal | number;
  totalAmount: Decimal | number;
  /** The address as charged, flattened onto the order. */
  shippingAddressSnapshot?: string | null;
  shippingCitySnapshot?: string | null;
  shippingRegionSnapshot?: string | null;
  customerNotes?: string | null;
  billingInfoId?: string | null;
  /** Set when the order was raised from a chat thread. */
  conversationId?: string | null;
  idempotencyKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export function orderItemCount(order: Order): number {
  return (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
}

export function orderCustomerName(order: Order): string {
  const customer = order.customer;
  if (!customer) return "";
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email;
}

export function orderShipsTo(order: Order): string {
  return [order.shippingAddressSnapshot, order.shippingCitySnapshot, order.shippingRegionSnapshot].filter(Boolean).join(", ");
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

export const ORDER_CHANNEL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  whatsapp: "WhatsApp",
  e_commerce: "Online store",
  pos: "POS",
  manual: "Manual",
};
