export const DELIVERY_RATES_TAG = "delivery-rates";

export function deliveryRateTag(id: string) {
  return `delivery-rate-${id}`;
}

export const DELIVERY_RATE_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const DELIVERY_RATE_ROUTES = {
  list: "/delivery-rates",
};
