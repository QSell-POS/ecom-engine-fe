import { defineColumns } from "@/lib/data-grid";
import { DEFAULT_CURRENCY } from "@/lib/constants/money";
import { paymentMethodLabel } from "@/lib/api/order/types";
import type { Payment } from "./types";

export const paymentStatuses = {
  pending: { label: "Pending", tone: "warning" as const },
  authorized: { label: "Authorized", tone: "info" as const },
  captured: { label: "Captured", tone: "success" as const },
  failed: { label: "Failed", tone: "danger" as const },
  refunded: { label: "Refunded", tone: "danger" as const },
  partially_refunded: { label: "Part refunded", tone: "warning" as const },
  cancelled: { label: "Cancelled", tone: "neutral" as const },
};

export const paymentColumns = defineColumns<Payment>([
  { id: "orderNumber", header: "Order", accessor: (payment) => payment.orderNumber ?? payment.orderId, width: 180, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  { id: "method", header: "Method", accessor: (payment) => paymentMethodLabel(payment.method), filter: { type: "multiselect" }, width: 150, mobile: { role: "subtitle" } },
  { id: "status", header: "Status", accessor: "status", type: "status", statuses: paymentStatuses, filter: { type: "multiselect" }, width: 140, mobile: { role: "status" } },
  { id: "amount", header: "Amount", accessor: "amount", type: "currency", currency: DEFAULT_CURRENCY, filter: { type: "range" }, width: 130, align: "right", mobile: { role: "trailing" } },
  { id: "transactionId", header: "Transaction", accessor: (payment) => payment.transactionId ?? payment.gatewayReference, width: 220, defaultHidden: true },
  { id: "failureReason", header: "Failure", accessor: "failureReason", width: 220, defaultHidden: true },
  { id: "paidAt", header: "Paid", accessor: "paidAt", type: "datetime", filter: { type: "date-range" }, width: 160 },
  { id: "createdAt", header: "Created", accessor: "createdAt", type: "datetime", filter: { type: "date-range" }, width: 160, mobile: { role: "meta", label: "" } },
]);
