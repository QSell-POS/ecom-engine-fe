import type { Brand } from "@/lib/api/brand/types";
import type { Category } from "@/lib/api/category/types";
import type { Decimal, MediaRef } from "@/lib/api/shared/types";

/** One attribute with every value it can take: { name: "Colour", values: ["Brown", "Cream"] }. */
export type ProductAttribute = {
  name: string;
  values: string[];
};

/** `available` is `quantity − reserved`. Show that, not `quantity`. */
export type ProductInventory = {
  quantity: number;
  reserved: number;
  available: number;
  stockAlert?: number | null;
};

/** A product image. The entry at position 0 is the primary image. */
export type ProductMedia = {
  id: string;
  mediaId: string;
  position: number;
  media: MediaRef;
};

export type ProductTag = { id: string; name: string };

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

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sku: string;
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
  inventory?: ProductInventory | null;
  createdAt?: string;
  updatedAt?: string;
};

export function primaryImage(product: Product): MediaRef | undefined {
  const sorted = [...(product.media ?? [])].sort((a, b) => a.position - b.position);
  return sorted[0]?.media;
}
