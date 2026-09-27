import { z } from "zod";
import { makeIdSchema, optionalUrl } from "@/lib/api/shared/validation";

export const BrandIdSchema = makeIdSchema("Brand");

export const CreateBrandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "URL handle must be at least 2 characters"),
  description: z.string().optional(),
  logo: optionalUrl,
  website: optionalUrl,
  isActive: z.boolean().default(true),
});

export const UpdateBrandSchema = BrandIdSchema.extend(CreateBrandSchema.shape);

export const DeleteBrandSchema = BrandIdSchema;
