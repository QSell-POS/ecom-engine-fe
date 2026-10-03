import "server-only";
import { apiClient, apiList } from "@/lib/api/client";
import { buildQuery, type ListParams, type ListResponse } from "@/lib/api/shared/types";
import type { Category } from "./types";
import type { CreateCategoryPayload, UpdateCategoryPayload } from "./dto";
import { CATEGORIES_TAG, categoryTag } from "./constants";

/** Filters: search, isActive, parentId, rootsOnly, sortBy, sortOrder. */
export async function getCategories(params?: ListParams): Promise<ListResponse<Category>> {
  return apiList<Category>(`/categories${buildQuery(params)}`, { auth: "key", tags: [CATEGORIES_TAG], revalidate: 60 });
}

export async function getCategoriesBySlug(slug: string) {
  return apiClient<Category>(`/categories/slug/${slug}`, { auth: "key", tags: [categoryTag(slug)], revalidate: 60, allow404: true });
}

export async function getCategoriesById(id: string) {
  return apiClient<Category>(`/categories/${id}`, { auth: "key", tags: [categoryTag(id)], revalidate: 60, allow404: true });
}

/** Top-level categories only — enough to build the storefront nav. */
export async function getRootCategories() {
  return getCategories({ rootsOnly: true, limit: 100, sortBy: "position", sortOrder: "ASC" });
}

export async function getCategoriesAdmin(params?: ListParams): Promise<ListResponse<Category>> {
  return apiList<Category>(`/admin/categories${buildQuery(params)}`, { auth: "owner", tags: [CATEGORIES_TAG], revalidate: 60 });
}

export async function getCategoryAdmin(id: string) {
  return apiClient<Category>(`/admin/categories/${id}`, { auth: "owner", tags: [categoryTag(id)], revalidate: 60 });
}

export async function createCategory(data: CreateCategoryPayload) {
  return apiClient<Category>("/admin/categories", { method: "POST", body: data, auth: "owner" });
}

export async function updateCategory(id: string, data: UpdateCategoryPayload) {
  return apiClient<Category>(`/admin/categories/${id}`, { method: "PUT", body: data, auth: "owner" });
}

export async function deleteCategory(id: string) {
  // 409 when products or child categories still reference it.
  return apiClient<null>(`/admin/categories/${id}`, { method: "DELETE", auth: "owner" });
}
