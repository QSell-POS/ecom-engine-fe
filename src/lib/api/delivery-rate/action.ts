"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api/client";
import { actionClient, authActionClient } from "@/lib/safe-action";
import { createDeliveryRate, deleteDeliveryRate, getDeliveryQuote, updateDeliveryRate } from "./service";
import { DELIVERY_RATES_TAG, deliveryRateTag } from "./constants";
import { CreateDeliveryRateSchema, DeleteDeliveryRateSchema, UpdateDeliveryRateSchema } from "./validation";

/**
 * Public: checkout quotes shipping before the shopper signs in or picks a
 * payment method. A store with rates that don't cover the address answers
 * with a 400 (`DELIVERY_UNAVAILABLE`); surfaced here as a plain message
 * rather than the generic action error, since it is routine, not a bug.
 */
export const getDeliveryQuoteAction = actionClient
  .inputSchema(z.object({ region: z.string().min(1), city: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    try {
      return { quote: await getDeliveryQuote(parsedInput) };
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        return { quote: null, unavailable: true as const };
      }
      throw error;
    }
  });

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
