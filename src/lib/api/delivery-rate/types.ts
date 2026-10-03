/**
 * Shipping is a flat cost per region/city. A rate with `city: null` is the
 * regional fallback; an exact city match wins over it.
 */
export type DeliveryRate = {
  id: string;
  region: string;
  city?: string | null;
  shippingCost: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** GET /delivery-rates/quote — what checkout charges as `deliveryCharge`. */
export type DeliveryQuote = {
  region: string;
  city: string;
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
