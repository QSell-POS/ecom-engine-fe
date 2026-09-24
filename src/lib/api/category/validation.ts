import { z } from "zod";

export const CategoryIdSchema = z.object({
  id: z.string().min(1, "Category id is required"),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  image: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().optional(),
  ),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = CategoryIdSchema.extend(
  CreateCategorySchema.shape,
);

export const DeleteCategorySchema = CategoryIdSchema;
