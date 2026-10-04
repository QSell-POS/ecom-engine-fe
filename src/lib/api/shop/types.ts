import type { Decimal } from "@/lib/api/shared/types";
import type { Product } from "@/lib/api/product/types";
import type { CustomerStatus } from "@/lib/api/customer/types";

/**
 * The shopper surface: x-api-key **and** the customer JWT. Dropping either is
 * a 401. The owner and customer tokens are not interchangeable — they carry a
 * `typ` claim — so they are kept in separate cookies.
 */
export type ShopCustomer = {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  status?: CustomerStatus;
  createdAt?: string;
};

/** Both /customers/register and /customers/login return this under `data`. */
export type ShopCustomerSession = { customer: ShopCustomer; accessToken: string };

/** Cart lines carry the live product, so prices are decimal strings. */
export type ShopCartItem = {
  id: string;
  productId: string;
  quantity: number;
  product?: Pick<Product, "id" | "name" | "slug" | "sellingPrice" | "compareAtPrice" | "media" | "inventory">;
};

export type ShopCart = {
  id: string;
  customerId: string;
  items: ShopCartItem[];
};

export type ShopWishlistItem = {
  id: string;
  productId: string;
  product?: Pick<Product, "id" | "name" | "slug" | "sellingPrice" | "media">;
  createdAt?: string;
};

/**
 * POST /payments/:orderId/initiate. For eSewa, post `formFields` to
 * `paymentUrl`; for Khalti, redirect straight to it.
 */
export type PaymentInitiation = {
  paymentId: string;
  method: "esewa" | "khalti" | string;
  paymentUrl: string;
  formFields?: Record<string, string>;
};

/** eSewa needs a form POST, Khalti a plain redirect. */
export function needsFormPost(initiation: PaymentInitiation): boolean {
  return Boolean(initiation.formFields && Object.keys(initiation.formFields).length > 0);
}

export function cartSubtotal(cart: ShopCart | null | undefined): number {
  return (cart?.items ?? []).reduce((sum, item) => sum + Number.parseFloat((item.product?.sellingPrice as Decimal) ?? "0") * item.quantity, 0);
}

export function cartItemCount(cart: ShopCart | null | undefined): number {
  return (cart?.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
}
