import type { ProductAttribute, ProductBadge } from "./types";

export type CreateProductPayload = {
  name: string;
  slug: string;
  sku: string;
  /** Decimal string, e.g. "1299.00". */
  sellingPrice: string;
  compareAtPrice?: string;
  description?: string;
  barcode?: string;
  hsCode?: string;
  isActive?: boolean;
  stockAlert?: number;
  attributes?: ProductAttribute[];
  badges?: ProductBadge[];
  brandId?: string;
  categoryId?: string;
  tagIds?: string[];
  /** Ordered, max 20. The order is the display order; the first is primary. */
  mediaIds?: string[];
  /** Seeds inventory on create. */
  initialQuantity?: number;
};

/** `sku` cannot be changed, so it is not part of an update. */
export type UpdateProductPayload = Partial<Omit<CreateProductPayload, "sku" | "initialQuantity">> & {
  id: string;
};
