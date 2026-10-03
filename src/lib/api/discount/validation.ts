import { z } from "zod";
import { makeIdSchema, optionalText } from "@/lib/api/shared/validation";
import { DISCOUNT_SCOPES, DISCOUNT_TYPES } from "./types";

export const DiscountIdSchema = makeIdSchema("Discount");

const optionalCount = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(1, "Must be at least one").optional(),
);

/** A bare date from <input type="date"> becomes the ISO timestamp the API wants. */
const optionalDate = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : new Date(String(value)).toISOString()),
  z.string().optional(),
);

export const DiscountFieldsSchema = z.object({
  name: z.string().min(2, "Give the offer a name"),
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .transform((value) => value.trim().toUpperCase()),
  type: z.enum(DISCOUNT_TYPES),
  discountValue: z.coerce.number().min(0, "Must be zero or more"),
  scope: z.enum(DISCOUNT_SCOPES),
  description: optionalText,
  startsAt: optionalDate,
  endsAt: optionalDate,
  isActive: z.boolean().optional(),
  maxTotalUses: optionalCount,
  maxUsesPerCustomer: optionalCount,
});

export const CreateDiscountSchema = DiscountFieldsSchema.refine(
  (data) => data.type !== "percentage" || data.discountValue <= 100,
  { path: ["discountValue"], message: "A percentage cannot be over 100" },
).refine((data) => !data.startsAt || !data.endsAt || new Date(data.startsAt) <= new Date(data.endsAt), {
  path: ["endsAt"],
  message: "The end date must come after the start date",
});

export const UpdateDiscountSchema = DiscountFieldsSchema.partial().extend({
  id: z.string().min(1, "Discount id is required"),
});
