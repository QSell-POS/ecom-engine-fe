import type { AdjustmentType, ReferenceType } from "./types";

export type ReceiveStockPayload = {
  /** Integer, at least 1. */
  quantity: number;
  /** Required, decimal string: this prices the batch. */
  costPrice: string;
  /** Optional, and it also updates the product's selling price. */
  sellingPrice?: string;
  batchNumber?: string;
  /** Must be a UUID when present. */
  purchaseReferenceId?: string;
  note?: string;
};

/**
 * The direction comes from `type`, so the quantity is unsigned — a negative
 * value is rejected. For stock_count it may be 0 and means the new absolute
 * quantityOnHand; for the others it is the number of units moving.
 */
export type AdjustStockPayload = {
  type: AdjustmentType;
  quantity: number;
  /** Optional decimal string; prices the new batch on an increase. */
  unitCost?: string;
  note?: string;
};

/** reserve / release / fulfill all take this. */
export type MoveStockPayload = {
  quantity: number;
  /** A UUID — the order id for an order hold. Not `orderId`. */
  referenceId: string;
  referenceType?: ReferenceType | string;
};

export type BulkReceivePayload = {
  items: (ReceiveStockPayload & { productId: string })[];
};

/** All-or-nothing: if one line lacks stock the whole call 409s. */
export type BulkReservePayload = {
  /** Required, at the top level rather than per item. */
  referenceId: string;
  referenceType?: ReferenceType | string;
  items: { productId: string; quantity: number }[];
};
