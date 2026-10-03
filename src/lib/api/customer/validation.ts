import { z } from "zod";
import { makeIdSchema, optionalText } from "@/lib/api/shared/validation";
import { CUSTOMER_STATUSES } from "./types";

export const CustomerIdSchema = makeIdSchema("Customer");

/** 7–15 digits, optionally +-prefixed, as the API validates it. */
const phoneSchema = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.string().regex(/^\+?\d{7,15}$/, "Enter 7 to 15 digits, optionally starting with +").optional(),
);

export const CreateCustomerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: optionalText,
  email: z.email("Enter a valid email address"),
  phone: phoneSchema,
  password: z.preprocess((value) => (value === "" ? undefined : value), z.string().min(8, "Use at least 8 characters").optional()),
  status: z.enum(CUSTOMER_STATUSES).optional(),
});

export const UpdateCustomerStatusSchema = CustomerIdSchema.extend({
  status: z.enum(CUSTOMER_STATUSES),
});

export const DeleteCustomerSchema = CustomerIdSchema;
