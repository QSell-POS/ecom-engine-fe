import type { Brand } from "@/lib/api/brand/types";
import type { Category } from "@/lib/api/category/types";
import type { Decimal, MediaRef } from "@/lib/api/shared/types";

/** One attribute with every value it can take: { name: "Colour", values: ["Brown", "Cream"] }. */
export type ProductAttribute = {
  name: string;
  values: string[];
};

/**
 * Stock as the product payload carries it. There is no `available` field here
 * — derive it with `availableStock()`, which is the figure to show.
 */
export type ProductInventory = {
  id?: string;
  productId?: string;
  quantityOnHand: number;
  quantityReserved: number;
  /** Present on the inventory list route, not on a product. */
  quantityAvailable?: number;
  createdAt?: string;
  updatedAt?: string;
};

/** A product image. The entry at position 0 is the primary image. */
export type ProductMedia = {
  id: string;
  /** Admin payloads carry it; the storefront view does not. */
  mediaId?: string;
  position: number;
  media: MediaRef;
};

export type ProductTag = { id: string; name: string; slug?: string };

export const PRODUCT_BADGES = [
  "featured",
  "best_seller",
  "top_selling",
  "limited_edition",
  "new_arrival",
  "trending",
  "premium",
  "exclusive",
  "clearance",
  "hot_deal",
] as const;

export type ProductBadge = (typeof PRODUCT_BADGES)[number];

/**
 * The product as the API returns it. Two views share this type:
 *
 * - **Admin** (`/admin/products`) is the raw row: `sku`, `barcode`, `hsCode`,
 *   `isActive`, `stockAlert` and a nested `inventory` with counts.
 * - **Storefront** (`/products`) is trimmed: those fields are stripped and
 *   stock is the single boolean `inStock`.
 *
 * Fields only one view carries are optional. Use `inStockNow()` rather than
 * reading either stock representation directly.
 */
export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  /** Admin view only. */
  sku?: string;
  barcode?: string | null;
  hsCode?: string | null;
  isActive?: boolean;
  /** Decimal strings, not numbers — parse with toAmount before arithmetic. */
  sellingPrice: Decimal;
  compareAtPrice?: Decimal | null;
  stockAlert?: number | null;
  attributes?: ProductAttribute[] | null;
  badges?: ProductBadge[];
  tags?: ProductTag[];
  brandId?: string | null;
  categoryId?: string | null;
  brand?: Pick<Brand, "id" | "name" | "slug"> | null;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  media?: ProductMedia[];
  /** Admin view only — the storefront sends `inStock` instead. */
  inventory?: ProductInventory | null;
  /** Storefront view only. */
  inStock?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Whether it can be bought right now, from whichever stock representation the
 * payload carries.
 */
export function inStockNow(product: Product): boolean {
  if (typeof product.inStock === "boolean") return product.inStock;
  return availableStock(product) > 0;
}

/** What can still be sold: on hand minus what open orders are holding. */
export function availableStock(product: { inventory?: ProductInventory | null }): number {
  const inventory = product.inventory;
  if (!inventory) return 0;
  return inventory.quantityAvailable ?? Math.max(0, inventory.quantityOnHand - inventory.quantityReserved);
}

export function primaryImage(product: Product): MediaRef | undefined {
  const sorted = [...(product.media ?? [])].sort((a, b) => a.position - b.position);
  return sorted[0]?.media;
}
