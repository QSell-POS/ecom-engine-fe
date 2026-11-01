import type { CustomerApi } from "./contracts";
import { createLiveCustomerApi } from "./http/customer-api";
import { createMockCustomerApi } from "./mock/customer-api";
import type { StoreMode, StoreProfile, Vertical } from "./types";

/**
 * The shopper's session: cart, wishlist, account, orders.
 *
 * A `live` store calls the real shopper routes in `lib/api/shop` (server
 * actions, so the customer JWT stays in an httpOnly cookie) through
 * `./http/customer-api.ts`. `demo`, `preview` and `design` modes — a
 * theme-store preview or the builder canvas — have no real tenant behind
 * them, so they keep the localStorage-backed mock.
 */
export function createCustomerApi(store: { storeKey: string; vertical: Vertical; checkout: StoreProfile["checkout"]; mode: StoreMode }): CustomerApi {
  return store.mode === "live" ? createLiveCustomerApi() : createMockCustomerApi(store);
}
