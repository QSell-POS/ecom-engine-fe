export const RETURNS_TAG = "returns";

export function orderReturnsTag(orderId: string) {
  return `order-${orderId}-returns`;
}

export const RETURN_ROUTES = {
  list: "/returns",
  detail: (id: string) => `/returns?open=${encodeURIComponent(id)}`,
};
