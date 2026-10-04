import type { CustomerApi } from "./contracts";
import { createMockCustomerApi } from "./mock/customer-api";
import type { StoreProfile, Vertical } from "./types";

/**
 * The shopper's session: cart, wishlist, account, orders.
 *
 * This is still the localStorage-backed mock, deliberately. The real shopper
 * routes are implemented and typed in `lib/api/shop` (server actions, so the
 * customer JWT stays in an httpOnly cookie), but they do not fit this
 * contract:
 *
 * - `placeOrder` here takes a card token and a shipping method; the API takes
 *   `addressId` plus `cod | esewa | khalti`, and gateway payments finish with
 *   a redirect to eSewa or Khalti.
 * - cart lines are addressed by product id, not line id, and quantity moves
 *   by a delta (`qty: -1`), not an absolute value.
 * - there is no "me" route: the shopper's identity comes from their token.
 *
 * Switching the storefront over is a UI change (checkout, cart stepper, auth
 * views) against `lib/api/shop/action.ts`, not another adapter behind this
 * interface — which is why no adapter pretends to implement it.
 */
export function createCustomerApi(store: { storeKey: string; vertical: Vertical; checkout: StoreProfile["checkout"] }): CustomerApi {
  return createMockCustomerApi(store);
}
