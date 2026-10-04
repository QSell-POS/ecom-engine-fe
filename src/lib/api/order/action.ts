"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { INVENTORY_TAG } from "@/lib/api/inventory/constants";
import { updateOrderStatus } from "./service";
import { ORDERS_TAG, orderTag } from "./constants";
import { UpdateOrderStatusSchema } from "./validation";

export const updateOrderStatusAction = authActionClient.inputSchema(UpdateOrderStatusSchema).action(async ({ parsedInput }) => {
  const { id, status } = parsedInput;
  const order = await updateOrderStatus(id, { status });

  updateTag(ORDERS_TAG);
  updateTag(orderTag(id));
  // delivered fulfils the reservation, cancelled releases it — either way stock moved.
  if (status === "delivered" || status === "cancelled") updateTag(INVENTORY_TAG);

  return { order };
});
