import { defineColumns } from "@/lib/data-grid";
import { DEFAULT_CURRENCY } from "@/lib/constants/money";
import { toAmount } from "@/lib/api/shared/types";
import { ORDER_CHANNEL_LABELS, ORDER_CHANNELS, orderCustomerName, orderItemCount, orderShipsTo, paymentMethodLabel, type Order } from "./types";

export const orderStatuses = {
  pending: { label: "Pending", tone: "warning" as const },
  confirmed: { label: "Confirmed", tone: "info" as const },
  processing: { label: "Processing", tone: "info" as const },
  shipped: { label: "Shipped", tone: "info" as const },
  delivered: { label: "Delivered", tone: "success" as const },
  cancelled: { label: "Cancelled", tone: "neutral" as const },
  refunded: { label: "Refunded", tone: "danger" as const },
};

export const paymentStatuses = {
  paid: { label: "Paid", tone: "success" as const },
  unpaid: { label: "Unpaid", tone: "warning" as const },
  pending: { label: "Pending", tone: "info" as const },
  failed: { label: "Failed", tone: "danger" as const },
  refunded: { label: "Refunded", tone: "neutral" as const },
  partially_refunded: { label: "Partly refunded", tone: "neutral" as const },
};

// Phone and email are their own (hidden by default) columns so the grid's
// search matches them even when they are not shown.
export const orderColumns = defineColumns<Order>([
  { id: "orderNumber", header: "Order", accessor: "orderNumber", width: 180, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  { id: "customer", header: "Customer", accessor: orderCustomerName, width: 220, mobile: { role: "subtitle" } },
  { id: "customerPhone", header: "Phone", accessor: (order) => order.customer?.phone ?? "", width: 150, defaultHidden: true },
  { id: "customerEmail", header: "Email", accessor: (order) => order.customer?.email ?? "", width: 220, defaultHidden: true },
  { id: "shipsTo", header: "Ships to", accessor: orderShipsTo, width: 260 },
  { id: "status", header: "Status", accessor: "status", type: "status", statuses: orderStatuses, filter: { type: "multiselect" }, width: 130, mobile: { role: "status" } },
  { id: "paymentStatus", header: "Payment", accessor: (order) => order.paymentStatus ?? "", type: "status", statuses: paymentStatuses, filter: { type: "multiselect" }, width: 130 },
  { id: "paymentMethod", header: "Method", accessor: (order) => paymentMethodLabel(order.paymentMethod), filter: { type: "multiselect" }, width: 150 },
  {
    id: "channel",
    header: "Channel",
    accessor: (order) => (order.channel ? ORDER_CHANNEL_LABELS[order.channel] ?? order.channel : ""),
    filter: { type: "multiselect", options: ORDER_CHANNELS.map((channel) => ({ value: ORDER_CHANNEL_LABELS[channel], label: ORDER_CHANNEL_LABELS[channel] })) },
    width: 130,
  },
  { id: "items", header: "Items", accessor: orderItemCount, type: "number", width: 90, align: "right" },
  { id: "subtotalAmount", header: "Subtotal", accessor: (order) => toAmount(order.subtotalAmount), type: "currency", currency: DEFAULT_CURRENCY, width: 130, align: "right", defaultHidden: true },
  { id: "discountAmount", header: "Discount", accessor: (order) => toAmount(order.discountAmount), type: "currency", currency: DEFAULT_CURRENCY, width: 120, align: "right", defaultHidden: true },
  { id: "deliveryCharge", header: "Delivery", accessor: (order) => toAmount(order.deliveryCharge), type: "currency", currency: DEFAULT_CURRENCY, width: 120, align: "right", defaultHidden: true },
  { id: "totalAmount", header: "Total", accessor: (order) => toAmount(order.totalAmount), type: "currency", currency: DEFAULT_CURRENCY, filter: { type: "range" }, width: 130, align: "right", mobile: { role: "trailing" } },
  { id: "createdAt", header: "Placed", accessor: "createdAt", type: "datetime", filter: { type: "date-range" }, width: 160, mobile: { role: "meta", label: "" } },
  { id: "customerId", header: "Customer id", accessor: "customerId", width: 200, defaultHidden: true },
]);
