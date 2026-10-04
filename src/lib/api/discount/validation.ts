import { z } from "zod";
import { makeIdSchema, optionalText } from "@/lib/api/shared/validation";
import { DISCOUNT_TYPES } from "./types";

export const DiscountIdSchema = makeIdSchema("Discount");

const optionalCount = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(1, "Must be at least one").optional(),
);

/** A date from <input type="date"> becomes the ISO timestamp the API wants. */
const required_date = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : new Date(String(value)).toISOString()),
  z.string({ message: "Required" }),
);

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : new Date(String(value)).toISOString()),
  z.string().optional(),
);

export const CreateDiscountSchema = z
  .object({
    name: z.string().min(2, "Give the offer a name"),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,50}$/, "3 to 50 characters: letters, digits, _ or -"),
    type: z.enum(DISCOUNT_TYPES),
    discountValue: z.coerce.number().min(0.01, "Must be more than zero").max(99999999),
    // Both dates are required by the API.
    startsAt: required_date,
    endsAt: required_date,
    isActive: z.boolean().optional(),
    maxTotalUses: optionalCount,
    maxUsesPerCustomer: optionalCount,
    description: optionalText,
  })
  .refine((data) => data.type !== "percentage" || data.discountValue <= 100, {
    path: ["discountValue"],
    message: "A percentage cannot be over 100",
  })
  .refine((data) => new Date(data.startsAt) <= new Date(data.endsAt), {
    path: ["endsAt"],
    message: "The end date must come after the start date",
  });

/** Only these fields may change — the rest are immutable on the API. */
export const UpdateDiscountSchema = z.object({
  id: z.string().min(1, "Discount id is required"),
  name: z.string().min(2, "Give the offer a name").optional(),
  description: optionalText,
  startsAt: optionalDate,
  endsAt: optionalDate,
  isActive: z.boolean().optional(),
  maxTotalUses: optionalCount,
  maxUsesPerCustomer: optionalCount,
});
