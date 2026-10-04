import { z } from "zod";
import { emptyToUndefined, makeIdSchema } from "@/lib/api/shared/validation";

export const CategoryIdSchema = makeIdSchema("Category");

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "URL handle is required"),
  description: z.string().optional(),
  parentId: z.preprocess(emptyToUndefined, z.uuid("Pick a parent category").nullish()),
  position: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional()),
  imageId: z.preprocess(emptyToUndefined, z.uuid("Upload a category image").nullish()),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = CategoryIdSchema.extend(CreateCategorySchema.shape);

export const DeleteCategorySchema = CategoryIdSchema;
