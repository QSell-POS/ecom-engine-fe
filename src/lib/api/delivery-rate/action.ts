"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { createDeliveryRate, deleteDeliveryRate, updateDeliveryRate } from "./service";
import { DELIVERY_RATES_TAG, deliveryRateTag } from "./constants";
import { CreateDeliveryRateSchema, DeleteDeliveryRateSchema, UpdateDeliveryRateSchema } from "./validation";

export const createDeliveryRateAction = authActionClient.inputSchema(CreateDeliveryRateSchema).action(async ({ parsedInput }) => {
  const rate = await createDeliveryRate(parsedInput);
  updateTag(DELIVERY_RATES_TAG);
  return { rate };
});

export const updateDeliveryRateAction = authActionClient.inputSchema(UpdateDeliveryRateSchema).action(async ({ parsedInput }) => {
  const { id, ...data } = parsedInput;
  const rate = await updateDeliveryRate(id, data);

  updateTag(DELIVERY_RATES_TAG);
  updateTag(deliveryRateTag(id));

  return { rate };
});

export const deleteDeliveryRateAction = authActionClient.inputSchema(DeleteDeliveryRateSchema).action(async ({ parsedInput }) => {
  await deleteDeliveryRate(parsedInput.id);

  updateTag(DELIVERY_RATES_TAG);
  updateTag(deliveryRateTag(parsedInput.id));

  return { success: true };
});
