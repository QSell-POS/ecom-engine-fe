import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { CreateProductPayload, UpdateProductPayload } from "./dto";
import type { Product } from "./types";
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

// Public catalog reads (API key only, so they stay cacheable).

export async function getProducts(params?: ListParams): Promise<ListResponse<Product>> {
  return apiList<Product>(`/products${buildQuery(params)}`, { auth: "key", tags: [PRODUCTS_TAG], revalidate: 60 });
}

export async function getProductById(id: string) {
  return apiClient<Product>(`/products/${id}`, { auth: "key", tags: [productTag(id)], revalidate: 60, allow404: true });
}

export async function getProductBySlug(slug: string) {
  return apiClient<Product>(`/products/slug/${slug}`, { auth: "key", tags: [productTag(slug)], revalidate: 60, allow404: true });
}
