import "server-only";
import { apiClient } from "@/lib/api/client";
import { PaginationParams, ListResponse } from "@/lib/api/shared/types";
import { Product } from "./types";
import { CreateProductPayload, UpdateProductPayload } from "./dto";
import { PRODUCTS_TAG, productTag } from "./constants";

export async function getProductsAdmin(params?: PaginationParams) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.search) searchParams.set("search", params.search);
  const query = searchParams.toString();

  return apiClient<ListResponse<Product>>(
    `/admin/products${query ? `?${query}` : ""}`,
    { tags: [PRODUCTS_TAG], revalidate: 60 },
  );
}

export async function getProductAdmin(id: string) {
  return apiClient<Product>(`/admin/products/${id}`, {
    tags: [productTag(id)],
    revalidate: 60,
  });
}

export async function createProduct(data: CreateProductPayload) {
  return apiClient<Product>("/admin/products", {
    method: "POST",
    body: data,
  });
}

export async function updateProduct({ id, ...data }: UpdateProductPayload) {
  return apiClient<Product>("/admin/products", {
    method: "PUT",
    body: { id, ...data },
  });
}

export async function deleteProduct(id: string) {
  return apiClient<null>(`/admin/products/${id}`, { method: "DELETE" });
}
