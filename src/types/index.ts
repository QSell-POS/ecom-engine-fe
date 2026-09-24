export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  website?: string;
  description?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  parentId?: string | null;
  parent?: Category | null;
  position?: number | null;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

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

export type ListResponse<T> = {
  data: T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
