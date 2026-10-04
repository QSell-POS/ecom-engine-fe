"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { actionClient, customerActionClient } from "@/lib/safe-action";
import type { ListParams } from "@/lib/api/shared/types";
import { clearCustomerSession, getCustomerSummary, setCustomerSession } from "@/lib/api/session";
import {
  cancelShopOrder,
  changeCartItem,
  clearCart,
  clearWishlist,
  createShopAddress,
  deleteShopAddress,
  getCart,
  getShopAddresses,
  getShopOrder,
  getShopOrders,
  getWishlist,
  initiatePayment,
  loginShopCustomer,
  placeShopOrder,
  registerShopCustomer,
  removeCartItem,
  removeWishlistItem,
  retryPayment,
  setDefaultShopAddress,
  toggleWishlist,
  updateShopAddress,
} from "./service";
import { CART_TAG, SHOP_ADDRESSES_TAG, SHOP_ORDERS_TAG, WISHLIST_TAG, shopOrderTag } from "./constants";
import { AddressSchema, CartItemSchema, PlaceOrderSchema, ShopLoginSchema, ShopRegisterSchema } from "./validation";

const IdSchema = z.object({ id: z.string().min(1, "An id is required") });
const ProductSchema = z.object({ productId: z.uuid("Product is required") });

export const shopLoginAction = actionClient.inputSchema(ShopLoginSchema).action(async ({ parsedInput }) => {
  const { customer, accessToken } = await loginShopCustomer(parsedInput);
  await setCustomerSession(accessToken, customer);
  updateTag(CART_TAG);
  updateTag(WISHLIST_TAG);
  return { customer };
});

export const shopRegisterAction = actionClient.inputSchema(ShopRegisterSchema).action(async ({ parsedInput }) => {
  const { customer, accessToken } = await registerShopCustomer(parsedInput);
  await setCustomerSession(accessToken, customer);
  return { customer };
});

/**
 * Hydrates the storefront's shopper state on mount. There is no `/me` route,
 * so "signed in, as whom" comes from the readable cookie `setCustomerSession`
 * wrote at login — not from a network call — and cart/wishlist are only
 * fetched once that cookie says there is someone to fetch them for.
 */
export const getShopSessionAction = actionClient.inputSchema(z.object({})).action(async () => {
  const customer = await getCustomerSummary();
  if (!customer) return { customer: null, cart: null, wishlist: [] };
  const [cart, wishlist] = await Promise.all([getCart(), getWishlist()]);
  return { customer, cart, wishlist };
});

export const getShopOrdersAction = customerActionClient
  .inputSchema(z.object({ page: z.number().optional(), limit: z.number().optional() }).optional())
  .action(async ({ parsedInput }) => {
    const result = await getShopOrders(parsedInput as ListParams | undefined);
    return { orders: result.data };
  });

export const getShopOrderAction = customerActionClient.inputSchema(IdSchema).action(async ({ parsedInput }) => {
  const order = await getShopOrder(parsedInput.id);
  return { order };
});

export async function shopLogoutAction() {
  await clearCustomerSession();
  updateTag(CART_TAG);
  updateTag(WISHLIST_TAG);
}

/** Adds or removes `qty` units; the API treats it as a delta. */
export const changeCartItemAction = customerActionClient.inputSchema(CartItemSchema).action(async ({ parsedInput }) => {
  const cart = await changeCartItem(parsedInput);
  updateTag(CART_TAG);
  return { cart };
});

export const removeFromCartAction = customerActionClient.inputSchema(ProductSchema).action(async ({ parsedInput }) => {
  const cart = await removeCartItem(parsedInput.productId);
  updateTag(CART_TAG);
  return { cart };
});

export const clearCartAction = customerActionClient.inputSchema(z.object({})).action(async () => {
  const cart = await clearCart();
  updateTag(CART_TAG);
  return { cart };
});

export const placeOrderAction = customerActionClient
  .inputSchema(PlaceOrderSchema.extend({ idempotencyKey: z.uuid().optional() }))
  .action(async ({ parsedInput }) => {
    const { idempotencyKey, ...payload } = parsedInput;
    // Pass the caller's key when it has one, so a retry of the same submit is
    // a replay rather than a second order.
    const order = idempotencyKey ? await placeShopOrder(payload, idempotencyKey) : await placeShopOrder(payload);
    // Stock is reserved and the cart should be reconciled against the order.
    updateTag(CART_TAG);
    updateTag(SHOP_ORDERS_TAG);
    return { order };
  });

export const cancelOrderAction = customerActionClient.inputSchema(IdSchema).action(async ({ parsedInput }) => {
  const order = await cancelShopOrder(parsedInput.id);
  updateTag(SHOP_ORDERS_TAG);
  updateTag(shopOrderTag(parsedInput.id));
  return { order };
});

/** Returns where to send the shopper; the caller does the redirect or form post. */
export const initiatePaymentAction = customerActionClient.inputSchema(IdSchema).action(async ({ parsedInput }) => {
  const initiation = await initiatePayment(parsedInput.id);
  return { initiation };
});

export const retryPaymentAction = customerActionClient.inputSchema(IdSchema).action(async ({ parsedInput }) => {
  const initiation = await retryPayment(parsedInput.id);
  return { initiation };
});

export const getShopAddressesAction = customerActionClient.inputSchema(z.object({})).action(async () => {
  return { addresses: await getShopAddresses() };
});

export const saveAddressAction = customerActionClient
  .inputSchema(AddressSchema.extend({ id: z.uuid().optional() }))
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    const address = id ? await updateShopAddress(id, data) : await createShopAddress(data);
    updateTag(SHOP_ADDRESSES_TAG);
    return { address };
  });

export const deleteAddressAction = customerActionClient.inputSchema(IdSchema).action(async ({ parsedInput }) => {
  await deleteShopAddress(parsedInput.id);
  updateTag(SHOP_ADDRESSES_TAG);
  return { success: true };
});

export const setDefaultAddressAction = customerActionClient.inputSchema(IdSchema).action(async ({ parsedInput }) => {
  const address = await setDefaultShopAddress(parsedInput.id);
  updateTag(SHOP_ADDRESSES_TAG);
  return { address };
});

export const toggleWishlistAction = customerActionClient.inputSchema(ProductSchema).action(async ({ parsedInput }) => {
  const result = await toggleWishlist(parsedInput.productId);
  updateTag(WISHLIST_TAG);
  return { result };
});

export const removeWishlistItemAction = customerActionClient.inputSchema(IdSchema).action(async ({ parsedInput }) => {
  await removeWishlistItem(parsedInput.id);
  updateTag(WISHLIST_TAG);
  return { success: true };
});

export const clearWishlistAction = customerActionClient.inputSchema(z.object({})).action(async () => {
  await clearWishlist();
  updateTag(WISHLIST_TAG);
  return { success: true };
});
