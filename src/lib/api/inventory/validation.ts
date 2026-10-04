import { z } from "zod";
import { optionalText } from "@/lib/api/shared/validation";
import { ADJUSTMENT_TYPES } from "./types";

const ProductIdSchema = z.object({ productId: z.uuid("Product is required") });

/** Prices go to the API as decimal strings, never floats. */
const optionalPrice = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : String(value)),
  z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount").optional(),
);

export const ReceiveStockSchema = ProductIdSchema.extend({
  quantity: z.coerce.number().int().positive("Enter how many arrived"),
  costPrice: optionalPrice,
  sellingPrice: optionalPrice,
  batchNumber: optionalText,
  purchaseReferenceId: optionalText,
  note: optionalText,
});

export const AdjustStockSchema = ProductIdSchema.extend({
  quantity: z.coerce.number().int().refine((value) => value !== 0, "Enter a non-zero change"),
  type: z.enum(ADJUSTMENT_TYPES),
  note: optionalText,
});

export const MoveStockSchema = ProductIdSchema.extend({
  quantity: z.coerce.number().int().positive("Enter a quantity"),
  orderId: z.preprocess((value) => (value === "" ? undefined : value), z.uuid().optional()),
});

export const BulkReceiveSchema = z.object({
  items: z.array(ReceiveStockSchema).min(1, "Add at least one product"),
});

export const BulkReserveSchema = z.object({
  items: z.array(z.object({ productId: z.uuid(), quantity: z.coerce.number().int().positive() })).min(1, "Add at least one product"),
  orderId: z.preprocess((value) => (value === "" ? undefined : value), z.uuid().optional()),
});
