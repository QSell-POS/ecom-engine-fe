import { defineColumns } from "@/lib/data-grid";
import { toAmount } from "@/lib/api/shared/types";
import { DEFAULT_CURRENCY } from "@/lib/constants/money";
import { ORDER_CHANNEL_LABELS } from "@/lib/api/order/types";
import { RETURN_STATUS_META, RETURN_TYPE_LABELS, returnCustomerName, returnItemCount, type OrderReturn } from "./types";

export const returnStatuses = RETURN_STATUS_META;

export const returnColumns = defineColumns<OrderReturn>([
  { id: "returnNumber", header: "Return", accessor: "returnNumber", width: 170, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  { id: "orderNumber", header: "Order", accessor: (rma) => rma.order?.orderNumber ?? "", width: 170, mobile: { role: "subtitle" } },
  { id: "customer", header: "Customer", accessor: returnCustomerName, width: 200 },
  { id: "type", header: "Type", accessor: (rma) => RETURN_TYPE_LABELS[rma.type], filter: { type: "multiselect" }, width: 150 },
  { id: "status", header: "Status", accessor: "status", type: "status", statuses: returnStatuses, filter: { type: "multiselect" }, width: 130, mobile: { role: "status" } },
  { id: "source", header: "Opened by", accessor: (rma) => (rma.source === "customer" ? "Customer" : "Store"), filter: { type: "multiselect" }, width: 120 },
  {
    id: "channel",
    header: "Channel",
    accessor: (rma) => (rma.order?.channel ? (ORDER_CHANNEL_LABELS[rma.order.channel] ?? rma.order.channel) : ""),
    filter: { type: "multiselect" },
    width: 130,
    defaultHidden: true,
  },
  { id: "reason", header: "Reason", accessor: "reason", width: 200 },
  { id: "items", header: "Items", accessor: returnItemCount, type: "number", width: 90, align: "right" },
  { id: "returnedValue", header: "Value", accessor: (rma) => toAmount(rma.returnedValue), type: "currency", currency: DEFAULT_CURRENCY, width: 120, align: "right" },
  { id: "refundAmount", header: "Refunded", accessor: (rma) => toAmount(rma.refundAmount), type: "currency", currency: DEFAULT_CURRENCY, width: 120, align: "right", mobile: { role: "trailing" } },
  { id: "createdAt", header: "Opened", accessor: "createdAt", type: "datetime", filter: { type: "date-range" }, width: 160, mobile: { role: "meta", label: "" } },
]);
