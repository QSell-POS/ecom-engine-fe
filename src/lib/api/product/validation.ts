import { z } from "zod";
import { emptyToUndefined, makeIdSchema, optionalText } from "@/lib/api/shared/validation";
import { PRODUCT_BADGES } from "./types";

// The form edits these as real arrays (chips and a repeater), so no string
// parsing here. Left optional, not defaulted: a partial update such as the
// grid's activate/deactivate must not wipe them.
const attributesSchema = z
  .array(
    z.object({
      name: z.string().trim().min(1, "Name this attribute"),
      values: z.array(z.string().trim().min(1)).min(1, "Add at least one value"),
    }),
  )
  .optional();

const badgesSchema = z.array(z.enum(PRODUCT_BADGES)).optional();

const productFields = {
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "URL handle is required"),
  description: optionalText,
  sku: z.string().min(1, "SKU is required"),
  barcode: optionalText,
  hsCode: optionalText,
  isActive: z.boolean().default(true),
  sellingPrice: z.string().regex(/^\d+(\.\d+)?$/, "Enter a valid price"),
  compareAtPrice: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d+(\.\d+)?$/, "Enter a valid price")
      .optional(),
  ),
  stockAlert: z.coerce.number().int().min(0).optional(),
  attributes: attributesSchema,
  badges: badgesSchema,
  brandId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  categoryId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
  tagIds: z.array(z.string().uuid()).optional(),
  mediaIds: z.array(z.string().uuid()).max(20, "Up to 20 images").optional(),
  initialQuantity: z.coerce.number().int().min(0).optional(),
};

export const ProductIdSchema = makeIdSchema("Product");

export const CreateProductSchema = z.object(productFields);
// `sku` and `initialQuantity` are create-only: the API rejects them on update.
const updatableFields = Object.fromEntries(
  Object.entries(productFields).filter(([field]) => field !== "sku" && field !== "initialQuantity"),
) as Omit<typeof productFields, "sku" | "initialQuantity">;

export const UpdateProductSchema = ProductIdSchema.extend({
  ...updatableFields,
  name: productFields.name.optional(),
  slug: productFields.slug.optional(),
  sellingPrice: productFields.sellingPrice.optional(),
  isActive: z.boolean().optional(),
});
export const DeleteProductSchema = ProductIdSchema;
