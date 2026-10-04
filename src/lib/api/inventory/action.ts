"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { PRODUCTS_TAG } from "@/lib/api/product/constants";
import { adjustStock, fulfillStock, receiveStock, receiveStockBulk, releaseStock, reserveStock, reserveStockBulk } from "./service";
import { INVENTORY_TAG, inventoryBatchesTag, inventoryTag, inventoryTransactionsTag } from "./constants";
import { AdjustStockSchema, BulkReceiveSchema, BulkReserveSchema, MoveStockSchema, ReceiveStockSchema } from "./validation";

function revalidateProduct(productId: string) {
  updateTag(INVENTORY_TAG);
  updateTag(inventoryTag(productId));
  updateTag(inventoryBatchesTag(productId));
  updateTag(inventoryTransactionsTag(productId));
  // Stock shows on product lists and on the storefront.
  updateTag(PRODUCTS_TAG);
}

export const receiveStockAction = authActionClient.inputSchema(ReceiveStockSchema).action(async ({ parsedInput }) => {
  const { productId, ...data } = parsedInput;
  const item = await receiveStock(productId, data);
  revalidateProduct(productId);
  return { item };
});

export const adjustStockAction = authActionClient.inputSchema(AdjustStockSchema).action(async ({ parsedInput }) => {
  const { productId, ...data } = parsedInput;
  const item = await adjustStock(productId, data);
  revalidateProduct(productId);
  return { item };
});

export const reserveStockAction = authActionClient.inputSchema(MoveStockSchema).action(async ({ parsedInput }) => {
  const { productId, ...data } = parsedInput;
  const item = await reserveStock(productId, data);
  revalidateProduct(productId);
  return { item };
});

export const releaseStockAction = authActionClient.inputSchema(MoveStockSchema).action(async ({ parsedInput }) => {
  const { productId, ...data } = parsedInput;
  const item = await releaseStock(productId, data);
  revalidateProduct(productId);
  return { item };
});

export const fulfillStockAction = authActionClient.inputSchema(MoveStockSchema).action(async ({ parsedInput }) => {
  const { productId, ...data } = parsedInput;
  const item = await fulfillStock(productId, data);
  revalidateProduct(productId);
  return { item };
});

export const receiveStockBulkAction = authActionClient.inputSchema(BulkReceiveSchema).action(async ({ parsedInput }) => {
  const items = await receiveStockBulk(parsedInput);
  for (const item of parsedInput.items) revalidateProduct(item.productId);
  return { items };
});

export const reserveStockBulkAction = authActionClient.inputSchema(BulkReserveSchema).action(async ({ parsedInput }) => {
  const items = await reserveStockBulk(parsedInput);
  for (const item of parsedInput.items) revalidateProduct(item.productId);
  return { items };
});
