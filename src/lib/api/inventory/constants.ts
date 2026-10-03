export const INVENTORY_TAG = "inventory";

export function inventoryTag(productId: string) {
  return `inventory-${productId}`;
}

export function inventoryBatchesTag(productId: string) {
  return `inventory-${productId}-batches`;
}

export function inventoryTransactionsTag(productId: string) {
  return `inventory-${productId}-transactions`;
}

export const INVENTORY_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const INVENTORY_ROUTES = {
  list: "/inventory",
  detail: (productId: string) => `/inventory/${productId}`,
};
