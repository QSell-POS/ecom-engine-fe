import { z } from "zod";
import { makeIdSchema } from "@/lib/api/shared/validation";
import { ORDER_STATUSES } from "./types";

export const OrderIdSchema = makeIdSchema("Order");

// No note field: unknown properties fail the whole request.
export const UpdateOrderStatusSchema = OrderIdSchema.extend({
  status: z.enum(ORDER_STATUSES),
});
