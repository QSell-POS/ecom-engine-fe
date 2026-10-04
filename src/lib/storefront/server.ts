import "server-only";
import type { CatalogApi } from "./contracts";
import { createApiCatalogApi } from "./http/catalog-api";
import { createMockCatalogApi } from "./mock/catalog-api";
import type { Vertical } from "./types";

/**
 * The catalog for a store. Pages only ever see the CatalogApi contract.
 *
 * `storeHost` is what makes one deployment serve every tenant: it travels on
 * each request as `x-store-host`, so the same code reads a different store's
 * catalog depending on which domain the shopper arrived on. Theme previews
 * and demo stores have no host and keep using demo content, so a merchant can
 * try a theme before they have products.
 */
export function getCatalogApi(store: { storeKey: string; vertical: Vertical; host?: string }): CatalogApi {
  const live = Boolean(process.env.API_URL && process.env.API_KEY) && !store.storeKey.startsWith("demo");
  return live ? createApiCatalogApi(store.host) : createMockCatalogApi(store.vertical);
}
