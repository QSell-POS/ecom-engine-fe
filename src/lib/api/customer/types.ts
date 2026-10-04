import type { Address } from "@/lib/api/shared/types";
import type { Product } from "@/lib/api/product/types";

export const CUSTOMER_STATUSES = ["active", "inactive", "banned"] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export type Customer = {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  status: CustomerStatus;
  ordersCount?: number;
  totalSpent?: number;
  lastOrderAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CustomerAddress = Address;

export type CustomerCartItem = {
  id: string;
  productId: string;
  quantity: number;
  product?: Pick<Product, "id" | "name" | "slug" | "sellingPrice" | "media" | "inventory">;
};

export type CustomerCart = {
  id: string;
  customerId: string;
  items: CustomerCartItem[];
  updatedAt?: string;
};

export function customerName(customer: Customer): string {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email;
}
