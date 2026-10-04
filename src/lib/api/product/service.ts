import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { CreateProductPayload, UpdateProductPayload } from "./dto";
import type { Product, ProductBadge } from "./types";
import { PRODUCTS_TAG, productTag } from "./constants";

/** Filters: search, brandId, categoryId, isActive, lowStock. */
export async function getProductsAdmin(params?: ListParams): Promise<ListResponse<Product>> {
  return apiList<Product>(`/admin/products${buildQuery(params)}`, { auth: "owner", tags: [PRODUCTS_TAG], revalidate: 60 });
}

export async function getProductAdmin(id: string) {
  return apiClient<Product>(`/admin/products/${id}`, { auth: "owner", tags: [productTag(id)], revalidate: 60 });
}

export async function createProduct(data: CreateProductPayload) {
  return apiClient<Product>("/admin/products", { method: "POST", body: data, auth: "owner" });
}

export async function updateProduct({ id, ...data }: UpdateProductPayload) {
  // PUT /admin/products/:id. Sending mediaIds replaces the whole set, in order.
  return apiClient<Product>(`/admin/products/${id}`, { method: "PUT", body: data, auth: "owner" });
}

export async function deleteProduct(id: string) {
  // 409 when the product is referenced by open orders.
  return apiClient<null>(`/admin/products/${id}`, { method: "DELETE", auth: "owner" });
}

// Public catalog reads. The storefront view is trimmed — `inStock` instead of
// counts — and a platform key needs `storeHost` to know which store is meant.

/**
 * Filters and sorts in SQL across the whole catalog, so none of this should be
 * redone in the client: applied to one page of forty, a price filter shows the
 * shopper the wrong products and a count that disagrees with what they see.
 */
export type CatalogQueryParams = ListParams & {
  categorySlug?: string;
  brandSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  /** A presence filter: anything other than `true` means no filter at all. */
  inStock?: true;
  badge?: ProductBadge;
  tag?: string;
  sort?: CatalogSort;
};

export const CATALOG_SORTS = ["newest", "oldest", "price-asc", "price-desc", "name-asc", "name-desc"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export async function getProducts(params?: CatalogQueryParams, storeHost?: string): Promise<ListResponse<Product>> {
  return apiList<Product>(`/products${buildQuery(params)}`, { auth: "key", storeHost, tags: [PRODUCTS_TAG], revalidate: 60 });
}

export async function getProductById(id: string, storeHost?: string) {
  return apiClient<Product>(`/products/${id}`, { auth: "key", storeHost, tags: [productTag(id)], revalidate: 60, allow404: true });
}

export async function getProductBySlug(slug: string, storeHost?: string) {
  return apiClient<Product>(`/products/slug/${slug}`, { auth: "key", storeHost, tags: [productTag(slug)], revalidate: 60, allow404: true });
}
