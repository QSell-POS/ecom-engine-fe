import { defineColumns } from "@/lib/data-grid";
import { DEFAULT_CURRENCY } from "@/lib/constants/money";
import { toAmount } from "@/lib/api/shared/types";
import { ORDER_CHANNEL_LABELS, ORDER_CHANNELS, orderItemCount, orderShipsTo, paymentMethodLabel, type Order } from "./types";

export const orderStatuses = {
  pending: { label: "Pending", tone: "warning" as const },
  confirmed: { label: "Confirmed", tone: "info" as const },
  processing: { label: "Processing", tone: "info" as const },
  shipped: { label: "Shipped", tone: "info" as const },
  delivered: { label: "Delivered", tone: "success" as const },
  cancelled: { label: "Cancelled", tone: "neutral" as const },
  refunded: { label: "Refunded", tone: "danger" as const },
};

// The API joins no customer onto an order — only customerId — so there is no
// name to show here. The shipping snapshot is what identifies an order at a
// glance instead.
export const orderColumns = defineColumns<Order>([
  { id: "orderNumber", header: "Order", accessor: "orderNumber", width: 180, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  { id: "shipsTo", header: "Ships to", accessor: orderShipsTo, width: 260, mobile: { role: "subtitle" } },
  { id: "status", header: "Status", accessor: "status", type: "status", statuses: orderStatuses, filter: { type: "multiselect" }, width: 130, mobile: { role: "status" } },
  { id: "paymentMethod", header: "Payment", accessor: (order) => paymentMethodLabel(order.paymentMethod), filter: { type: "multiselect" }, width: 150 },
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
