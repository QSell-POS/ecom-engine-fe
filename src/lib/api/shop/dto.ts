import type { AddressLabel } from "@/lib/api/shared/types";
import type { CheckoutPaymentMethod } from "@/lib/api/order/types";

export type ShopRegisterPayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email: string;
  password: string;
};

/** `identifier` is an email or a phone number. */
export type ShopLoginPayload = { identifier: string; password: string };

/** `qty` is a signed delta, not an absolute quantity. */
export type CartItemPayload = { productId: string; qty: number };

export type AddressPayload = {
  region: string;
  city: string;
  area: string;
  buildingStreet: string;
  address: string;
  landmark?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  label?: AddressLabel;
  isDefaultShipping?: boolean;
};

/**
 * Checkout. Items are passed explicitly rather than read from the cart, so
 * the two have to be reconciled by the caller.
 */
export type PlaceOrderPayload = {
  items: { productId: string; quantity: number }[];
  addressId: string;
  paymentMethod: CheckoutPaymentMethod;
  discountCode?: string;
};
