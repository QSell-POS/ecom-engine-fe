import { z } from "zod";
import { makeIdSchema, optionalText } from "@/lib/api/shared/validation";

export const CategoryIdSchema = makeIdSchema("Category");

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "URL handle is required"),
  image: optionalText,
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = CategoryIdSchema.extend(
  CreateCategorySchema.shape,
);

export const DeleteCategorySchema = CategoryIdSchema;
