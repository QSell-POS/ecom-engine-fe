import type { Decimal } from "@/lib/api/shared/types";

/**
 * Shipping is a flat cost per region/city. A rate with `city: null` is the
 * regional fallback; an exact city match wins over it.
 */
export type DeliveryRate = {
  id: string;
  region: string;
  city?: string | null;
  /** Decimal string from the admin list, a number from the quote route. */
  shippingCost: Decimal | number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * GET /delivery-rates/quote. `data` holds only the cost — the region and city
 * asked for are not echoed back. A store with no active rates quotes 0; one
 * whose rates do not cover the address is a 400 (DELIVERY_UNAVAILABLE), which
 * is also how checkout fails for that address.
 */
export type DeliveryQuote = {
  shippingCost: number;
};

/** Both are required by the API. */
export type DeliveryQuoteParams = {
  region: string;
  city: string;
};

export function deliveryZone(rate: DeliveryRate): string {
  return rate.city ? `${rate.city}, ${rate.region}` : `${rate.region} (whole region)`;
}
