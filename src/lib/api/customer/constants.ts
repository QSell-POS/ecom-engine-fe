export const CUSTOMERS_TAG = "customers";

export function customerTag(id: string) {
  return `customer-${id}`;
}

export function customerAddressesTag(id: string) {
  return `customer-${id}-addresses`;
}

export function customerCartTag(id: string) {
  return `customer-${id}-cart`;
}

export const CUSTOMER_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const CUSTOMER_ROUTES = {
  list: "/customers",
  detail: (id: string) => `/customers/${id}`,
};
