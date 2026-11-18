"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { INVENTORY_TAG } from "@/lib/api/inventory/constants";
import { RETURNS_TAG, orderReturnsTag } from "@/lib/api/returns/constants";
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
  // refunded runs a full return on the API: everything still out is restocked and refunded.
  if (status === "refunded") {
    updateTag(INVENTORY_TAG);
    updateTag(RETURNS_TAG);
    updateTag(orderReturnsTag(id));
  }

  return { order };
});
