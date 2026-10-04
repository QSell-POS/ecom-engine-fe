import "server-only";
import { getBrandBySlug, getBrands } from "@/lib/api/brand/service";
import { getCategories, getCategoriesBySlug } from "@/lib/api/category/service";
import { getProductBySlug, getProducts, type CatalogQueryParams, type CatalogSort } from "@/lib/api/product/service";
import { getProductReviews } from "@/lib/api/review/service";
import type { CatalogApi } from "../contracts";
import type { CatalogQuery, Paginated, Product, ProductSort } from "../types";
import { demoCatalog } from "../mock/catalog-data";
import { mapBrand, mapCategory, mapProduct, mapReview, summarise } from "./map";

/**
 * The storefront's catalog, served by the API.
 *
 * Filtering, sorting and paging all happen in SQL across the whole catalog —
 * nothing is narrowed in this process. `home` and `facets` are still composed
 * here, because neither exists as an endpoint and both are presentation: a
 * facet count that is a page stale is not the correctness problem a filtered
 * list is.
 *
 * Runs server-side only. `storeHost` says which tenant's catalog to read,
 * which is what makes one deployment serve every store.
 */
const COMPOSE_LIMIT = 100;

/** The contract's sort names onto the API's. */
const SORTS: Record<ProductSort, CatalogSort | undefined> = {
  newest: "newest",
  "price-asc": "price-asc",
  "price-desc": "price-desc",
  // No ranking signal exists for these three; the API's default order stands.
  featured: undefined,
  rating: undefined,
  "best-selling": undefined,
};

function toParams(query: CatalogQuery): CatalogQueryParams {
  return {
    page: query.page,
    limit: query.pageSize,
    search: query.q || undefined,
    categorySlug: query.category ?? undefined,
    // The API takes one brand; the contract allows several.
    brandSlug: query.brands[0],
    minPrice: query.minPrice ?? undefined,
    maxPrice: query.maxPrice ?? undefined,
    inStock: query.inStock ? true : undefined,
    sort: SORTS[query.sort],
  };
}

export function createApiCatalogApi(storeHost?: string): CatalogApi {
  return {
    home: async () => {
      const [products, categories, brands] = await Promise.all([
        getProducts({ limit: COMPOSE_LIMIT, sort: "newest" }, storeHost),
        getCategories({ limit: COMPOSE_LIMIT, isActive: true, sortBy: "position", sortOrder: "ASC" }, storeHost),
        getBrands({ limit: COMPOSE_LIMIT }, storeHost),
      ]);
      return {
        products: products.data.map(mapProduct),
        categories: categories.data.map(mapCategory),
        brands: brands.data.map(mapBrand),
        // No backend equivalent; the demo set keeps theme sections renderable.
        collections: [],
        media: demoCatalog("fashion").media,
      };
    },

    listProducts: async (query): Promise<Paginated<Product>> => {
      const response = await getProducts(toParams(query), storeHost);
      const total = response.meta?.total ?? response.data.length;
      return {
        items: response.data.map(mapProduct),
        total,
        page: query.page,
        pageSize: query.pageSize,
        pageCount: response.meta?.totalPages ?? Math.max(1, Math.ceil(total / query.pageSize)),
      };
    },

    facets: async (query) => {
      const [categories, brands, products] = await Promise.all([
        getCategories({ limit: COMPOSE_LIMIT, isActive: true }, storeHost),
        getBrands({ limit: COMPOSE_LIMIT }, storeHost),
        // Only for the price range, so one page is enough to bound it.
        getProducts({ limit: COMPOSE_LIMIT, search: query.q || undefined }, storeHost),
      ]);
      const prices = products.data.map((product) => Number.parseFloat(product.sellingPrice));
      return {
        categories: categories.data.map((category) => ({ ...mapCategory(category), count: 0 })),
        brands: brands.data.map((brand) => ({ ...mapBrand(brand), count: 0 })),
        price: { min: prices.length ? Math.floor(Math.min(...prices)) : 0, max: prices.length ? Math.ceil(Math.max(...prices)) : 0 },
      };
    },

    getProduct: async (slug) => {
      const product = await getProductBySlug(slug, storeHost);
      if (!product) return null;
      const mapped = mapProduct(product);
      // The API has no rating aggregate, so stars come from the review list.
      const reviews = await getProductReviews(product.id, { limit: COMPOSE_LIMIT }, storeHost).catch(() => ({ data: [] }));
      const summary = summarise(reviews.data.map(mapReview));
      return { ...mapped, rating: { average: summary.average, count: summary.count } };
    },

    relatedProducts: async (slug, limit) => {
      const product = await getProductBySlug(slug, storeHost);
      if (!product?.category?.slug) return [];
      const response = await getProducts({ limit: limit + 1, categorySlug: product.category.slug }, storeHost);
      return response.data
        .filter((candidate) => candidate.id !== product.id)
        .slice(0, limit)
        .map(mapProduct);
    },

    listCategories: async () => {
      const response = await getCategories({ limit: COMPOSE_LIMIT, isActive: true, sortBy: "position", sortOrder: "ASC" }, storeHost);
      return response.data.map(mapCategory);
    },

    getCategory: async (slug) => {
      const category = await getCategoriesBySlug(slug, storeHost);
      return category ? mapCategory(category) : null;
    },

    listBrands: async () => {
      const response = await getBrands({ limit: COMPOSE_LIMIT }, storeHost);
      return response.data.map(mapBrand);
    },

    getBrand: async (slug) => {
      const brand = await getBrandBySlug(slug, storeHost);
      return brand ? mapBrand(brand) : null;
    },

    listReviews: async (slug, page) => {
      const product = await getProductBySlug(slug, storeHost);
      if (!product) return { summary: summarise([]), reviews: { items: [], total: 0, page, pageSize: 10, pageCount: 1 } };

      const response = await getProductReviews(product.id, { page, limit: 10 }, storeHost);
      const reviews = response.data.map(mapReview);
      return {
        summary: summarise(reviews),
        reviews: {
          items: reviews,
          total: response.meta?.total ?? reviews.length,
          page,
          pageSize: 10,
          pageCount: response.meta?.totalPages ?? 1,
        },
      };
    },
  };
}
