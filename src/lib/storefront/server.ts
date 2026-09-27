import "server-only";
import type { CatalogApi } from "./contracts";
import { createHttpCatalogApi } from "./http/catalog-api";
import { createMockCatalogApi } from "./mock/catalog-api";
import type { Vertical } from "./types";

/**
 * The catalog for a store. With STOREFRONT_API_URL set, it's the NestJS API
 * (tenant resolved by the store's public key); otherwise the demo catalog for
 * the store's vertical. Pages only ever see the CatalogApi contract.
 */
export function getCatalogApi(store: { storeKey: string; vertical: Vertical }): CatalogApi {
  const baseUrl = process.env.STOREFRONT_API_URL;
  // Demo stores (theme previews) always use demo content.
  if (baseUrl && !store.storeKey.startsWith("demo")) return createHttpCatalogApi({ baseUrl, storeKey: store.storeKey });
  return createMockCatalogApi(store.vertical);
}
