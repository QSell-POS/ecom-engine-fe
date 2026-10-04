import "server-only";
import { randomUUID } from "node:crypto";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type Address, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { Order } from "@/lib/api/order/types";
import type { AddressPayload, CartItemPayload, PlaceOrderPayload, ShopLoginPayload, ShopRegisterPayload } from "./dto";
import type { PaymentInitiation, ShopCart, ShopCustomerSession, ShopWishlistItem } from "./types";
import { CART_TAG, SHOP_ADDRESSES_TAG, SHOP_ORDERS_TAG, WISHLIST_TAG, shopOrderTag } from "./constants";

// Account: API key only, because the shopper has no token yet.
export async function registerShopCustomer(data: ShopRegisterPayload) {
  return apiClient<ShopCustomerSession>("/customers/register", { method: "POST", body: data, auth: "key" });
}

export async function loginShopCustomer(data: ShopLoginPayload) {
  return apiClient<ShopCustomerSession>("/customers/login", { method: "POST", body: data, auth: "key" });
}

// Cart. Lines are addressed by productId, and `qty` is a delta.
export async function getCart() {
  return apiClient<ShopCart>("/cart", { auth: "customer", tags: [CART_TAG], revalidate: false });
}

/** `qty: 2` adds two, `qty: -1` removes one. Reaching 0 drops the line. */
export async function changeCartItem(data: CartItemPayload) {
  return apiClient<ShopCart>("/cart/items", { method: "POST", body: data, auth: "customer" });
}

export async function removeCartItem(productId: string) {
  return apiClient<ShopCart>(`/cart/items/${productId}`, { method: "DELETE", auth: "customer" });
}

export async function clearCart() {
  return apiClient<ShopCart>("/cart", { method: "DELETE", auth: "customer" });
}

// Orders.
export async function getShopOrders(params?: ListParams): Promise<ListResponse<Order>> {
  // limit is capped at 50 here, tighter than elsewhere.
  return apiList<Order>(`/orders${buildQuery(params)}`, { auth: "customer", tags: [SHOP_ORDERS_TAG], revalidate: false });
}

export async function getShopOrder(id: string) {
  // 404 when the order belongs to another customer.
  return apiClient<Order>(`/orders/${id}`, { auth: "customer", tags: [shopOrderTag(id)], revalidate: false, allow404: true });
}

/**
 * Checkout. The Idempotency-Key makes a retry after a timeout safe: without
 * one, the retry creates a second order.
 */
export async function placeShopOrder(data: PlaceOrderPayload, idempotencyKey?: string) {
  return apiClient<Order>("/orders", {
    method: "POST",
    body: data,
    auth: "customer",
    headers: { "Idempotency-Key": idempotencyKey ?? randomUUID() },
  });
}

/** No body. 409 once the order is past the cancellable window. */
export async function cancelShopOrder(id: string) {
  return apiClient<Order>(`/orders/${id}/cancel`, { method: "POST", auth: "customer" });
}

// Payments: start, or retry a failed attempt. Neither takes a body, and
// neither is used for cash on delivery.
export async function initiatePayment(orderId: string) {
  return apiClient<PaymentInitiation>(`/payments/${orderId}/initiate`, { method: "POST", auth: "customer" });
}

export async function retryPayment(orderId: string) {
  return apiClient<PaymentInitiation>(`/payments/${orderId}/retry`, { method: "POST", auth: "customer" });
}

// Address book.
export async function getShopAddresses() {
  const response = await apiList<Address>("/address", { auth: "customer", tags: [SHOP_ADDRESSES_TAG], revalidate: false });
  return response.data;
}

export async function getShopAddress(id: string) {
  return apiClient<Address>(`/address/${id}`, { auth: "customer", revalidate: false, allow404: true });
}

export async function createShopAddress(data: AddressPayload) {
  return apiClient<Address>("/address", { method: "POST", body: data, auth: "customer" });
}

export async function updateShopAddress(id: string, data: Partial<AddressPayload>) {
  return apiClient<Address>(`/address/${id}`, { method: "PUT", body: data, auth: "customer" });
}

export async function deleteShopAddress(id: string) {
  return apiClient<null>(`/address/${id}`, { method: "DELETE", auth: "customer" });
}

/** No body. Clears the flag on the previous default. */
export async function setDefaultShopAddress(id: string) {
  return apiClient<Address>(`/address/${id}/default`, { method: "PATCH", auth: "customer" });
}

// Wishlist. One idempotent toggle handles the heart on and off.
export async function getWishlist() {
  const response = await apiList<ShopWishlistItem>("/wishlist", { auth: "customer", tags: [WISHLIST_TAG], revalidate: false });
  return response.data;
}

export async function toggleWishlist(productId: string) {
  return apiClient<ShopWishlistItem | { added?: boolean } | null>("/wishlist/toggle", { method: "POST", body: { productId }, auth: "customer" });
}

/** Keyed by wishlist entry id, not product id. */
export async function removeWishlistItem(id: string) {
  return apiClient<null>(`/wishlist/${id}`, { method: "DELETE", auth: "customer" });
}

export async function clearWishlist() {
  return apiClient<null>("/wishlist", { method: "DELETE", auth: "customer" });
}
