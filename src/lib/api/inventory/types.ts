import type { Decimal } from "@/lib/api/shared/types";

/**
 * Inventory is tracked per product, with FIFO batches and an audit trail of
 * every movement. `available` is `quantity − reserved`: that is the figure to
 * show, not `quantity`.
 */
export type InventoryItem = {
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  reserved: number;
  available: number;
  /** Below this the product counts as low stock. */
  stockAlert?: number | null;
};

export type InventoryBatch = {
  id: string;
  productId: string;
  batchNumber?: string | null;
  quantity: number;
  remaining: number;
  costPrice?: Decimal | null;
  purchaseReferenceId?: string | null;
  note?: string | null;
  createdAt?: string;
};

export const INVENTORY_TRANSACTION_TYPES = [
  "initial",
  "purchase",
  "purchase_return",
  "sale",
  "customer_return",
  "reserve",
  "release",
  "adjustment_in",
  "adjustment_out",
  "damage",
  "stock_count",
] as const;

export type InventoryTransactionType = (typeof INVENTORY_TRANSACTION_TYPES)[number];

/** The adjustment reasons a person picks by hand. */
export const ADJUSTMENT_TYPES = ["adjustment_in", "adjustment_out", "damage", "stock_count", "customer_return", "purchase_return"] as const;
export type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number];

export type InventoryTransaction = {
  id: string;
  productId: string;
  type: InventoryTransactionType;
  /** Signed: negative for sales and downward adjustments. */
  quantity: number;
  balanceAfter?: number;
  batchId?: string | null;
  orderId?: string | null;
  note?: string | null;
  createdBy?: string | null;
  createdAt?: string;
};

export type StockState = "out" | "low" | "in-stock";

export function stockState(item: InventoryItem): StockState {
  if (item.available <= 0) return "out";
  if (item.stockAlert !== undefined && item.stockAlert !== null && item.available <= item.stockAlert) return "low";
  return "in-stock";
}

export const TRANSACTION_TYPE_LABELS: Record<InventoryTransactionType, string> = {
  initial: "Opening stock",
  purchase: "Purchase",
  purchase_return: "Returned to supplier",
  sale: "Sale",
  customer_return: "Customer return",
  reserve: "Reserved",
  release: "Released",
  adjustment_in: "Adjusted up",
  adjustment_out: "Adjusted down",
  damage: "Damage",
  stock_count: "Stock count",
};
