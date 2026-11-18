"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { INVENTORY_TAG } from "@/lib/api/inventory/constants";
import { ORDERS_TAG, orderTag } from "@/lib/api/order/constants";
import { approveReturn, completeReturn, createReturn, getOrderReturns, rejectReturn } from "./service";
import { RETURNS_TAG, orderReturnsTag } from "./constants";
import { CompleteReturnSchema, CreateReturnSchema, OrderIdOnlySchema, ReturnDecisionSchema } from "./validation";
import type { OrderReturn } from "./types";

/** A return touches the order (refunded total, status), its stock and the returns list. */
function invalidate(rma: Pick<OrderReturn, "orderId" | "status">) {
  updateTag(RETURNS_TAG);
  updateTag(orderReturnsTag(rma.orderId));
  if (rma.status === "completed") {
    updateTag(ORDERS_TAG);
    updateTag(orderTag(rma.orderId));
    updateTag(INVENTORY_TAG);
  }
}

/** The order view's returns panel (read through an action because the panel is client-rendered). */
export const loadOrderReturnsAction = authActionClient.inputSchema(OrderIdOnlySchema).action(async ({ parsedInput }) => {
  return { summary: await getOrderReturns(parsedInput.orderId) };
});

export const createReturnAction = authActionClient.inputSchema(CreateReturnSchema).action(async ({ parsedInput }) => {
  const rma = await createReturn(parsedInput);
  invalidate(rma);
  return { rma };
});

export const approveReturnAction = authActionClient.inputSchema(ReturnDecisionSchema).action(async ({ parsedInput }) => {
  const rma = await approveReturn(parsedInput.id, parsedInput.note);
  invalidate(rma);
  return { rma };
});

export const rejectReturnAction = authActionClient.inputSchema(ReturnDecisionSchema).action(async ({ parsedInput }) => {
  const rma = await rejectReturn(parsedInput.id, parsedInput.note);
  invalidate(rma);
  return { rma };
});

export const completeReturnAction = authActionClient.inputSchema(CompleteReturnSchema).action(async ({ parsedInput }) => {
  const { id, ...fields } = parsedInput;
  const rma = await completeReturn(id, fields);
  invalidate(rma);
  return { rma };
});
