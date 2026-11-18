import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/api/order/types";
import { RETURN_TYPES } from "./types";

const optionalNote = z.string().trim().max(2000).optional();

export const ReturnLineSchema = z.object({
  orderItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(1000),
  replacementProductId: z.string().min(1).optional(),
});

const RefundFieldsSchema = z.object({
  refundAmount: z.number().min(0).optional(),
  refundMethod: z.enum(PAYMENT_METHODS).optional(),
  refundReference: z.string().trim().max(255).optional(),
  restock: z.boolean().optional(),
  adminNote: optionalNote,
});

export const CreateReturnSchema = RefundFieldsSchema.extend({
  orderId: z.string().min(1),
  type: z.enum(RETURN_TYPES),
  items: z.array(ReturnLineSchema).min(1, "Pick at least one item").max(50),
  reason: z.string().trim().min(2, "Give a reason").max(100),
  complete: z.boolean().optional(),
});

export const ReturnIdSchema = z.object({ id: z.string().min(1) });

export const ReturnDecisionSchema = ReturnIdSchema.extend({ note: optionalNote });

export const CompleteReturnSchema = ReturnIdSchema.merge(RefundFieldsSchema);

export const OrderIdOnlySchema = z.object({ orderId: z.string().min(1) });
