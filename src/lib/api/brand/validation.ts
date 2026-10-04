import { z } from "zod";
import { emptyToUndefined, makeIdSchema, optionalUrl } from "@/lib/api/shared/validation";

export const BrandIdSchema = makeIdSchema("Brand");

export const CreateBrandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "URL handle must be at least 2 characters"),
  description: z.string().optional(),
  website: optionalUrl,
  // The logo is uploaded to /admin/media first; this is the asset id. An
  // explicit null clears it, so "" has to become undefined, not null.
  logoId: z.preprocess(emptyToUndefined, z.uuid("Upload a logo image").nullish()),
  isActive: z.boolean().default(true),
});

export const UpdateBrandSchema = BrandIdSchema.extend(CreateBrandSchema.shape);

export const DeleteBrandSchema = BrandIdSchema;
