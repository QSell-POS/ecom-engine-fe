"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { deleteReview, updateReviewVisibility } from "./service";
import { REVIEWS_TAG, productReviewsTag, reviewTag } from "./constants";
import { DeleteReviewSchema, UpdateReviewVisibilitySchema } from "./validation";

export const updateReviewVisibilityAction = authActionClient.inputSchema(UpdateReviewVisibilitySchema).action(async ({ parsedInput }) => {
  const { id, isVisible } = parsedInput;
  const review = await updateReviewVisibility(id, { isVisible });

  updateTag(REVIEWS_TAG);
  updateTag(reviewTag(id));
  if (review?.productId) updateTag(productReviewsTag(review.productId));

  return { review };
});

export const deleteReviewAction = authActionClient.inputSchema(DeleteReviewSchema).action(async ({ parsedInput }) => {
  await deleteReview(parsedInput.id);

  updateTag(REVIEWS_TAG);
  updateTag(reviewTag(parsedInput.id));

  return { success: true };
});
