import { z } from "zod";

export const BrandIdSchema = z.object({
  id: z.string().min(1, "Brand id is required"),
});

export const CreateBrandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional(),
  logo: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.url().optional(),
  ),
  website: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.url().optional(),
  ),
  isActive: z.boolean().default(true),
});

export const UpdateBrandSchema = BrandIdSchema.extend(CreateBrandSchema.shape);

export const DeleteBrandSchema = BrandIdSchema;
