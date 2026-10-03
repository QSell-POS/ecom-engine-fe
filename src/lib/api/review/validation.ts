import { z } from "zod";
import { makeIdSchema } from "@/lib/api/shared/validation";

export const ReviewIdSchema = makeIdSchema("Review");

export const UpdateReviewVisibilitySchema = ReviewIdSchema.extend({
  isVisible: z.boolean(),
});

export const DeleteReviewSchema = ReviewIdSchema;

export const CreateReviewSchema = z.object({
  productId: z.uuid("Product is required"),
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5),
  comment: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(2000, "Keep it under 2000 characters").optional()),
});
