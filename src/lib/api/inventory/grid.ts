import { defineColumns } from "@/lib/data-grid";
import { stockState, TRANSACTION_TYPE_LABELS, type InventoryItem, type InventoryTransaction } from "./types";

export const stockStates = {
  "in-stock": { label: "In stock", tone: "success" as const },
  low: { label: "Low", tone: "warning" as const },
  out: { label: "Out of stock", tone: "danger" as const },
};

export const inventoryColumns = defineColumns<InventoryItem>([
  { id: "productName", header: "Product", accessor: "productName", width: 260, hideable: false, defaultPin: "left", mobile: { role: "title" } },
  { id: "sku", header: "SKU", accessor: "sku", width: 140, mobile: { role: "subtitle" } },
  { id: "state", header: "Stock", accessor: (item) => stockState(item), type: "status", statuses: stockStates, filter: { type: "multiselect" }, width: 130, mobile: { role: "status" } },
  { id: "available", header: "Available", accessor: "available", type: "number", filter: { type: "range" }, width: 110, align: "right", mobile: { role: "trailing" } },
  { id: "reserved", header: "Reserved", accessor: "reserved", type: "number", width: 110, align: "right" },
  { id: "quantity", header: "On hand", accessor: "quantity", type: "number", width: 110, align: "right" },
  { id: "stockAlert", header: "Alert at", accessor: "stockAlert", type: "number", width: 100, align: "right", defaultHidden: true },
]);

const tone = {
  initial: "neutral",
  purchase: "success",
  purchase_return: "warning",
  sale: "info",
  customer_return: "warning",
  reserve: "info",
  release: "neutral",
  adjustment_in: "success",
  adjustment_out: "warning",
  damage: "danger",
  stock_count: "neutral",
} as const;

export const transactionTypes = Object.fromEntries(
  Object.entries(TRANSACTION_TYPE_LABELS).map(([type, label]) => [type, { label, tone: tone[type as keyof typeof tone] }]),
) as Record<keyof typeof tone, { label: string; tone: (typeof tone)[keyof typeof tone] }>;

export const inventoryTransactionColumns = defineColumns<InventoryTransaction>([
  { id: "createdAt", header: "When", accessor: "createdAt", type: "datetime", width: 170, hideable: false, mobile: { role: "subtitle" } },
  { id: "type", header: "Movement", accessor: "type", type: "status", statuses: transactionTypes, filter: { type: "multiselect" }, width: 160, mobile: { role: "title" } },
  { id: "quantity", header: "Qty", accessor: "quantity", type: "number", format: (value) => (Number(value) > 0 ? `+${value}` : String(value)), width: 90, align: "right", mobile: { role: "trailing" } },
  { id: "balanceAfter", header: "Balance", accessor: "balanceAfter", type: "number", width: 100, align: "right" },
  { id: "note", header: "Note", accessor: "note", width: 240 },
  { id: "orderId", header: "Order", accessor: "orderId", width: 140, defaultHidden: true },
  { id: "createdBy", header: "By", accessor: "createdBy", width: 140, defaultHidden: true },
]);
