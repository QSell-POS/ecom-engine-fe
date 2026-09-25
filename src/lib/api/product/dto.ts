import type { ProductAttribute } from "./types";

export type CreateProductPayload = {
  name: string;
  slug: string;
  description?: string;
  sku: string;
  barcode?: string;
  hsCode?: string;
  isActive?: boolean;
  sellingPrice: string;
  compareAtPrice?: string;
  stockAlert?: number;
  attributes?: ProductAttribute[];
  badges?: string[];
  brandId?: string;
  categoryId?: string;
  tagIds?: string[];
  initialQuantity?: number;
};

export type UpdateProductPayload = Partial<CreateProductPayload> & {
  id: string;
};
