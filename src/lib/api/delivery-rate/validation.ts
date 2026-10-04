import { z } from "zod";
import { makeIdSchema } from "@/lib/api/shared/validation";

export const DeliveryRateIdSchema = makeIdSchema("Delivery rate");

export const DeliveryRateFieldsSchema = z.object({
  region: z.string().min(2, "Region is required"),
  // Blank means "the whole region", which the API stores as null.
  city: z.preprocess((value) => (value === "" ? null : value), z.string().min(2, "Enter a city or leave it blank").nullish()),
  shippingCost: z.coerce.number().min(0, "Must be zero or more"),
  isActive: z.boolean().optional(),
});

export const CreateDeliveryRateSchema = DeliveryRateFieldsSchema;

export const UpdateDeliveryRateSchema = DeliveryRateFieldsSchema.partial().extend({
  id: z.string().min(1, "Delivery rate id is required"),
});

export const DeleteDeliveryRateSchema = DeliveryRateIdSchema;

export const DeliveryQuoteSchema = z.object({
  region: z.string().min(1, "Region is required"),
  city: z.string().min(1, "City is required"),
});
