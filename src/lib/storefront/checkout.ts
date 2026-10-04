import type { StoreProfile } from "./types";

// Price preview for the cart page and for mock-mode checkout. A live store's
// actual shipping cost comes from `GET /delivery-rates/quote` once an
// address is chosen (see CheckoutView) — this is only a free-shipping-
// threshold estimate shown before that, and the only number the backend
// has no equivalent of at all is tax: the real order model has none.

export function estimatedShipping(subtotal: number, config: StoreProfile["checkout"]): number {
  return subtotal >= config.freeShippingThreshold ? 0 : config.standardRate;
}

export class StorefrontError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
