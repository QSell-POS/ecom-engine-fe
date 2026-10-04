export const DISCOUNTS_TAG = "discounts";

export function discountTag(id: string) {
  return `discount-${id}`;
}

export const DISCOUNT_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const DISCOUNT_ROUTES = {
  list: "/discounts",
};
