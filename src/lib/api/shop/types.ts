import { toAmount, type Decimal } from "@/lib/api/shared/types";
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

/**
 * Cart lines embed the trimmed storefront product: prices are decimal strings
 * and stock is the boolean `inStock`, with no counts.
 */
export type ShopProduct = Pick<Product, "id" | "name" | "slug" | "sellingPrice" | "compareAtPrice" | "media" | "inStock">;

export type ShopCartItem = {
  id: string;
  productId: string;
  quantity: number;
  product?: ShopProduct;
};

/** No server-computed totals: the cart is lines only, and checkout prices it. */
export type ShopCart = {
  id: string;
  customerId: string;
  items: ShopCartItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type ShopWishlistItem = {
  id: string;
  productId: string;
  /** `isAvailable` mirrors the product's isActive, not its stock. */
  product?: ShopProduct & { isAvailable?: boolean };
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

/**
 * The API computes no cart totals, so this is the client's running subtotal.
 * Checkout is the authority on what is actually owed.
 */
export function cartSubtotal(cart: ShopCart | null | undefined): number {
  return (cart?.items ?? []).reduce((sum, item) => sum + toAmount(item.product?.sellingPrice as Decimal) * item.quantity, 0);
}

export function cartItemCount(cart: ShopCart | null | undefined): number {
  return (cart?.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
}
