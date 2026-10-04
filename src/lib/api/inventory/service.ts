import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { AdjustStockPayload, BulkReceivePayload, BulkReservePayload, MoveStockPayload, ReceiveStockPayload } from "./dto";
import type { InventoryBatch, InventoryItem, InventoryTransaction } from "./types";
import { INVENTORY_TAG, inventoryBatchesTag, inventoryTag, inventoryTransactionsTag } from "./constants";

/** Filters: search, brandId, categoryId, lowStock, outOfStock. */
export async function getInventory(params?: ListParams): Promise<ListResponse<InventoryItem>> {
  return apiList<InventoryItem>(`/admin/inventory${buildQuery(params)}`, { auth: "owner", tags: [INVENTORY_TAG], revalidate: 15 });
}

export async function getProductInventory(productId: string) {
  return apiClient<InventoryItem>(`/admin/inventory/${productId}`, { auth: "owner", tags: [inventoryTag(productId)], revalidate: 15 });
}

/** FIFO order: the batch that sells next is first. */
export async function getProductBatches(productId: string, params?: ListParams) {
  return apiList<InventoryBatch>(`/admin/inventory/${productId}/batches${buildQuery(params)}`, {
    auth: "owner",
    tags: [inventoryBatchesTag(productId)],
    revalidate: 30,
  });
}

/** The audit trail. Filter with `type`. */
export async function getProductTransactions(productId: string, params?: ListParams) {
  return apiList<InventoryTransaction>(`/admin/inventory/${productId}/transactions${buildQuery(params)}`, {
    auth: "owner",
    tags: [inventoryTransactionsTag(productId)],
    revalidate: 30,
  });
}

function movement(productId: string, verb: "adjust" | "receive" | "release" | "reserve" | "fulfill", body: unknown) {
  return apiClient<InventoryItem>(`/admin/inventory/${productId}/${verb}`, { method: "POST", body, auth: "owner" });
}

export const receiveStock = (productId: string, data: ReceiveStockPayload) => movement(productId, "receive", data);
export const adjustStock = (productId: string, data: AdjustStockPayload) => movement(productId, "adjust", data);
/** Checkout reserves automatically; these are for fixing things by hand. */
export const reserveStock = (productId: string, data: MoveStockPayload) => movement(productId, "reserve", data);
export const releaseStock = (productId: string, data: MoveStockPayload) => movement(productId, "release", data);
/** Converts a reservation into a sale and decrements quantity. */
export const fulfillStock = (productId: string, data: MoveStockPayload) => movement(productId, "fulfill", data);

/** One request for a whole delivery. */
export async function receiveStockBulk(data: BulkReceivePayload) {
  return apiClient<InventoryItem[]>("/admin/inventory/receive-bulk", { method: "POST", body: data, auth: "owner" });
}

export async function reserveStockBulk(data: BulkReservePayload) {
  return apiClient<InventoryItem[]>("/admin/inventory/reserve-bulk", { method: "POST", body: data, auth: "owner" });
}
