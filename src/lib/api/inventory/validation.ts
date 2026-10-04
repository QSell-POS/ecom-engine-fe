import { z } from "zod";
import { optionalText } from "@/lib/api/shared/validation";
import { ADJUSTMENT_TYPES } from "./types";

const ProductIdSchema = z.object({ productId: z.uuid("Product is required") });

/** Prices go to the API as decimal strings, never floats. */
const price = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : String(value)),
  z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount"),
);

const optionalPrice = price.optional();

export const ReceiveStockSchema = ProductIdSchema.extend({
  quantity: z.coerce.number().int().positive("Enter how many arrived"),
  // Required: a batch has to be priced.
  costPrice: price,
  sellingPrice: optionalPrice,
  batchNumber: optionalText,
  purchaseReferenceId: z.preprocess((value) => (value === "" ? undefined : value), z.uuid("Must be a UUID").optional()),
  note: optionalText,
});

/**
 * Unsigned: the direction is the `type`. stock_count is the exception — it may
 * be 0, and the number is the new absolute count rather than a movement.
 */
export const AdjustStockSchema = ProductIdSchema.extend({
  type: z.enum(ADJUSTMENT_TYPES),
  quantity: z.coerce.number().int().min(0, "Cannot be negative — pick a type instead"),
  unitCost: optionalPrice,
  note: optionalText,
}).refine((data) => data.type === "stock_count" || data.quantity >= 1, {
  path: ["quantity"],
  message: "Enter at least one unit",
});

/** reserve / release / fulfill. `referenceId` is required and must be a UUID. */
export const MoveStockSchema = ProductIdSchema.extend({
  quantity: z.coerce.number().int().positive("Enter a quantity"),
  referenceId: z.uuid("The order id this applies to"),
  referenceType: optionalText,
});

export const BulkReceiveSchema = z.object({
  items: z.array(ReceiveStockSchema).min(1, "Add at least one product"),
});

export const BulkReserveSchema = z.object({
  referenceId: z.uuid("The order id this applies to"),
  referenceType: optionalText,
  items: z.array(z.object({ productId: z.uuid(), quantity: z.coerce.number().int().positive() })).min(1, "Add at least one product"),
});
