import type { AdjustmentType } from "./types";

export type ReceiveStockPayload = {
  quantity: number;
  /** Decimal string, e.g. "800.00". */
  costPrice?: string;
  /** Optional, and it also updates the product's price. */
  sellingPrice?: string;
  batchNumber?: string;
  purchaseReferenceId?: string;
  note?: string;
};

export type AdjustStockPayload = {
  /** Signed: -3 writes off three units. */
  quantity: number;
  type: AdjustmentType;
  note?: string;
};

/** reserve / release / fulfill. */
export type MoveStockPayload = {
  quantity: number;
  orderId?: string;
};

export type BulkReceivePayload = {
  items: (ReceiveStockPayload & { productId: string })[];
};

/** All-or-nothing: if one line lacks stock the whole call fails. */
export type BulkReservePayload = {
  items: { productId: string; quantity: number }[];
  orderId?: string;
};
