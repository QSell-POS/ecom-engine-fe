import { z } from "zod";
import { optionalText } from "@/lib/api/shared/validation";
import { CHECKOUT_PAYMENT_METHODS } from "@/lib/api/order/types";

const phoneSchema = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.string().regex(/^\+?\d{7,15}$/, "Enter 7 to 15 digits, optionally starting with +").optional(),
);

export const ShopRegisterSchema = z.object({
  firstName: optionalText,
  lastName: optionalText,
  phone: phoneSchema,
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

/** Shoppers sign in with either an email or a phone number. */
export const ShopLoginSchema = z.object({
  identifier: z.string().min(3, "Enter your email or phone number"),
  password: z.string().min(1, "Enter your password"),
});

/** A signed delta between -1000 and 1000, never 0. */
export const CartItemSchema = z.object({
  productId: z.uuid("Product is required"),
  qty: z.coerce
    .number()
    .int()
    .min(-1000)
    .max(1000)
    .refine((value) => value !== 0, "Choose how many to add or remove"),
});

export const AddressSchema = z.object({
  region: z.string().min(2, "Region is required"),
  city: z.string().min(2, "City is required"),
  area: z.string().min(2, "Area is required"),
  buildingStreet: z.string().min(2, "House or street is required"),
  address: z.string().min(4, "Write the full address"),
  landmark: optionalText,
  postalCode: z.preprocess((value) => (value === "" ? undefined : value), z.string().min(4, "4 to 20 characters").max(20).optional()),
  latitude: z.preprocess((value) => (value === "" || value === undefined ? undefined : value), z.coerce.number().min(-90).max(90).optional()),
  longitude: z.preprocess((value) => (value === "" || value === undefined ? undefined : value), z.coerce.number().min(-180).max(180).optional()),
  label: z.enum(["HOME", "OFFICE", "OTHER"]).optional(),
  isDefaultShipping: z.boolean().optional(),
});

/**
 * `paymentMethod` decides what happens next: cod creates the order already
 * `confirmed`, while esewa/khalti create it `pending` and need
 * `initiatePayment` to get a redirect.
 */
export const PlaceOrderSchema = z.object({
  items: z
    .array(z.object({ productId: z.uuid(), quantity: z.coerce.number().int().positive() }))
    .min(1, "Your cart is empty")
    .max(50, "An order can hold 50 lines"),
  addressId: z.uuid("Choose a delivery address"),
  paymentMethod: z.enum(CHECKOUT_PAYMENT_METHODS),
  discountCode: optionalText,
});
