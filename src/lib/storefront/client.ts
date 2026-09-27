import type { CustomerApi } from "./contracts";
import { createHttpCustomerApi } from "./http/customer-api";
import { createMockCustomerApi } from "./mock/customer-api";
import type { StoreProfile, Vertical } from "./types";

/**
 * The shopper's session API. With NEXT_PUBLIC_STOREFRONT_API_URL set, calls
 * the NestJS API; otherwise a localStorage-backed mock with the same
 * behaviour. Components only ever see the CustomerApi contract.
 */
export function createCustomerApi(store: { storeKey: string; vertical: Vertical; checkout: StoreProfile["checkout"] }): CustomerApi {
  const baseUrl = process.env.NEXT_PUBLIC_STOREFRONT_API_URL;
  if (baseUrl && !store.storeKey.startsWith("demo")) return createHttpCustomerApi({ baseUrl, storeKey: store.storeKey });
  return createMockCustomerApi(store);
}
