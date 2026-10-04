"use server";

import { updateTag } from "next/cache";
import { authActionClient, customerActionClient } from "@/lib/safe-action";
import { createReview, deleteReview, updateReviewVisibility } from "./service";
import { REVIEWS_TAG, productReviewsTag, reviewTag } from "./constants";
import { CreateReviewSchema, DeleteReviewSchema, UpdateReviewVisibilitySchema } from "./validation";

/** Only a customer with a qualifying order may post; the API 403s otherwise. */
export const submitReviewAction = customerActionClient.inputSchema(CreateReviewSchema).action(async ({ parsedInput }) => {
  const review = await createReview(parsedInput);
  updateTag(productReviewsTag(parsedInput.productId));
  return { review };
});

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
