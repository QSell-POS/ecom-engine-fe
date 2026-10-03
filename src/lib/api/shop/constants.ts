export const CART_TAG = "shop-cart";
export const WISHLIST_TAG = "shop-wishlist";
export const SHOP_ORDERS_TAG = "shop-orders";
export const SHOP_ADDRESSES_TAG = "shop-addresses";

export function shopOrderTag(id: string) {
  return `shop-order-${id}`;
}
