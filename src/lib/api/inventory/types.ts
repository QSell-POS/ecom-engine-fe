import type { Decimal } from "@/lib/api/shared/types";

/**
 * Inventory is tracked per product, with FIFO batches and an audit trail of
 * every movement. `available` is `quantity − reserved`: that is the figure to
 * show, not `quantity`.
 */
export type InventoryItem = {
  /** The stock row's own id, not the product's. */
  id: string;
  productId: string;
  /** The product is nested; name, SKU and the alert threshold live on it. */
  product?: {
    id: string;
    name: string;
    sku?: string;
    slug?: string;
    sellingPrice?: Decimal;
    stockAlert?: number | null;
    isActive?: boolean;
  };
  quantityOnHand: number;
  quantityReserved: number;
  /** Returned by the list route; derived by availableStock() when absent. */
  quantityAvailable?: number;
  createdAt?: string;
  updatedAt?: string;
};

export function itemName(item: InventoryItem): string {
  return item.product?.name ?? item.productId;
}

/**
 * What can still be sold. Show this, not what is on hand. The API computes
 * `quantityAvailable` as max(0, onHand − reserved) and only sends it on the
 * inventory routes, so the fallback mirrors that clamp.
 */
export function availableStock(item: InventoryItem): number {
  return item.quantityAvailable ?? Math.max(0, item.quantityOnHand - item.quantityReserved);
}

/** Below this the product counts as low stock; it lives on the product. */
export function alertLevel(item: InventoryItem): number | null {
  return item.product?.stockAlert ?? null;
}

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

/**
 * The only four an adjustment may use — `sale`, `reserve` and the rest are
 * written by the system, not by this route.
 */
export const ADJUSTMENT_TYPES = ["adjustment_in", "adjustment_out", "damage", "stock_count"] as const;
export type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number];

/** What a movement was for. Free-text on the API, these are the known ones. */
export type ReferenceType = "ORDER" | "PURCHASE" | "MANUAL";

/** Append-only ledger: rows are only ever inserted. */
export type InventoryTransaction = {
  id: string;
  productId: string;
  inventoryId?: string;
  /** Null for a pure reservation, which touches no batch. */
  batchId?: string | null;
  type: InventoryTransactionType;
  /** Signed: positive in, negative out. */
  quantity: number;
  quantityBefore?: number;
  quantityAfter?: number;
  /** Decimal strings. */
  unitCost?: Decimal | null;
  unitSellingPrice?: Decimal | null;
  referenceType?: ReferenceType | string | null;
  referenceId?: string | null;
  performedBy?: string | null;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type StockState = "out" | "low" | "in-stock";

export function stockState(item: InventoryItem): StockState {
  const available = availableStock(item);
  const alert = alertLevel(item);
  if (available <= 0) return "out";
  if (alert !== null && available <= alert) return "low";
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
