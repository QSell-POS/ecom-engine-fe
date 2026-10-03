import "server-only";
import type { CatalogApi } from "./contracts";
import { createApiCatalogApi } from "./http/catalog-api";
import { createMockCatalogApi } from "./mock/catalog-api";
import type { Vertical } from "./types";

/**
 * The catalog for a store. With API_URL and API_KEY set, this is the real
 * catalog for the tenant that owns the key; otherwise it is the demo catalog
 * for the store's vertical. Pages only ever see the CatalogApi contract.
 */
export function getCatalogApi(store: { storeKey: string; vertical: Vertical }): CatalogApi {
  // Demo stores (theme previews) always use demo content, so a merchant can
  // try a theme before they have products.
  const live = Boolean(process.env.API_URL && process.env.API_KEY) && !store.storeKey.startsWith("demo");
  return live ? createApiCatalogApi() : createMockCatalogApi(store.vertical);
}
