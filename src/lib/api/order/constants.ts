export const ORDERS_TAG = "orders";

export function orderTag(id: string) {
  return `order-${id}`;
}

export const ORDER_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const ORDER_ROUTES = {
  list: "/orders",
  // No /orders/:id page: the grid opens the order in its side panel.
  detail: (id: string) => `/orders?open=${encodeURIComponent(id)}`,
};
