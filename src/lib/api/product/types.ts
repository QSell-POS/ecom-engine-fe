import { Brand } from "@/lib/api/brand/types";
import { Category } from "@/lib/api/category/types";

export type ProductAttribute = {
  name: string;
  value: string;
};

export type ProductInventory = {
  id: string;
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sku: string;
  barcode?: string | null;
  hsCode?: string | null;
  isActive?: boolean;
  sellingPrice: string;
  compareAtPrice?: string | null;
  stockAlert?: number | null;
  attributes?: ProductAttribute[] | null;
  badges?: string[];
  tags?: string[];
  brandId?: string | null;
  categoryId?: string | null;
  brand?: Brand | null;
  category?: Category | null;
  inventory?: ProductInventory | null;
  tagIds?: string[];
  createdAt?: string;
  updatedAt?: string;
};
