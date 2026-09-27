import type { CatalogApi } from "../contracts";
import { StorefrontError } from "../checkout";
import { serializeCatalogQuery } from "../query";

// HTTP catalog client for the NestJS storefront API. Server-side only: the
// store's public key identifies the tenant; responses are cached briefly and
// tagged so the backend (or an admin mutation) can revalidate them.

export function createHttpCatalogApi({ baseUrl, storeKey }: { baseUrl: string; storeKey: string }): CatalogApi {
  async function get<T>(path: string, { allow404 = false } = {}): Promise<T> {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      headers: { "x-storefront-key": storeKey, accept: "application/json" },
      next: { revalidate: 60, tags: [`storefront:${storeKey}`] },
    });
    if (allow404 && response.status === 404) return null as T;
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new StorefrontError(body?.message ?? `Storefront API error (${response.status})`, response.status);
    }
    return response.json() as Promise<T>;
  }

  const q = (params: URLSearchParams) => (params.size ? `?${params}` : "");

  return {
    home: () => get("/storefront/home"),
    listProducts: (query) => {
      const params = serializeCatalogQuery(query);
      params.set("page", String(query.page));
      params.set("pageSize", String(query.pageSize));
      return get(`/storefront/products${q(params)}`);
    },
    facets: (query) => get(`/storefront/products/facets${q(serializeCatalogQuery({ ...query, page: 1 }))}`),
    getProduct: (slug) => get(`/storefront/products/${encodeURIComponent(slug)}`, { allow404: true }),
    relatedProducts: (slug, limit) => get(`/storefront/products/${encodeURIComponent(slug)}/related?limit=${limit}`),
    listCategories: () => get("/storefront/categories"),
    getCategory: (slug) => get(`/storefront/categories/${encodeURIComponent(slug)}`, { allow404: true }),
    listBrands: () => get("/storefront/brands"),
    getBrand: (slug) => get(`/storefront/brands/${encodeURIComponent(slug)}`, { allow404: true }),
    listReviews: (slug, page) => get(`/storefront/products/${encodeURIComponent(slug)}/reviews?page=${page}`),
  };
}
