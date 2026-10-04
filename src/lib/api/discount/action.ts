"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { createDiscount, updateDiscount } from "./service";
import { DISCOUNTS_TAG, discountTag } from "./constants";
import { CreateDiscountSchema, UpdateDiscountSchema } from "./validation";

export const createDiscountAction = authActionClient.inputSchema(CreateDiscountSchema).action(async ({ parsedInput }) => {
  const discount = await createDiscount(parsedInput);
  updateTag(DISCOUNTS_TAG);
  return { discount };
});

export const updateDiscountAction = authActionClient.inputSchema(UpdateDiscountSchema).action(async ({ parsedInput }) => {
  const { id, ...data } = parsedInput;
  const discount = await updateDiscount(id, data);

  updateTag(DISCOUNTS_TAG);
  updateTag(discountTag(id));

  return { discount };
});
