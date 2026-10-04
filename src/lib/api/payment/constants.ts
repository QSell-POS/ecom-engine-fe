export const PAYMENTS_TAG = "payments";

export function paymentTag(id: string) {
  return `payment-${id}`;
}

export const PAYMENT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const PAYMENT_ROUTES = {
  list: "/payments",
};
