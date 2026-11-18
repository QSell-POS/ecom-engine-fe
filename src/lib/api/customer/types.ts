import type { Address } from "@/lib/api/shared/types";
import type { Product } from "@/lib/api/product/types";
import { ORDER_CHANNELS, type OrderChannel } from "@/lib/api/order/types";

export const CUSTOMER_STATUSES = ["active", "inactive", "banned"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

/** Where a customer was acquired — the same vocabulary as an order's channel. */
export const CUSTOMER_CHANNELS = ORDER_CHANNELS;
export type CustomerChannel = OrderChannel;

/**
 * No relations are loaded on any customer route — orders, addresses and carts
 * each have their own — so there is no order count or lifetime spend here.
 * The password hash is stripped from every payload.
 */
export type Customer = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  /** Null for a customer created from a social chat without one. */
  email: string | null;
  phone?: string | null;
  status: CustomerStatus;
  /** Storefront sign-up (`e_commerce`), chat (`facebook`/`instagram`), or set by the admin who added them. */
  channel?: CustomerChannel;
  isEmailVerified?: boolean;
  lastLoginAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type CustomerAddress = Address;

export type CustomerCartItem = {
  id: string;
  productId: string;
  quantity: number;
  product?: Pick<Product, "id" | "name" | "slug" | "sellingPrice" | "media" | "inStock">;
};

export type CustomerCart = {
  id: string;
  customerId: string;
  items: CustomerCartItem[];
  updatedAt?: string;
};

export function customerName(customer: Customer): string {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email || customer.phone || "Unnamed customer";
}
