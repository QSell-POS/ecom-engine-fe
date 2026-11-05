import "server-only";
import { getBrandBySlug, getBrands } from "@/lib/api/brand/service";
import { getCategories, getCategoriesBySlug } from "@/lib/api/category/service";
import type { Category } from "@/lib/api/category/types";
import { getProductBySlug, getProducts, type CatalogQueryParams, type CatalogSort } from "@/lib/api/product/service";
import { getProductReviews } from "@/lib/api/review/service";
import type { CatalogApi } from "../contracts";
import type { CatalogQuery, Paginated, Product, ProductSort } from "../types";
import { demoCatalog } from "../mock/catalog-data";
import type { Product as ApiProduct } from "@/lib/api/product/types";
import { COLLECTION_BADGES, mapBrand, mapCategory, mapProduct, mapReview, summarise } from "./map";

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

// The public /categories endpoint rejects isActive/sortBy/sortOrder (400), so
// the active filter and position order are applied here instead.
function publicCategories(categories: Category[]): Category[] {
  return categories
    .filter((category) => category.isActive !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

/** Collections the API understands; anything else is dropped rather than sent to a 400. */
const API_COLLECTIONS = new Set([...Object.keys(COLLECTION_BADGES), "sale"]);

/** Collections the home page's product sections can ask for, fetched by name so none comes up empty. */
const HOME_COLLECTIONS = ["new-arrivals", "best-sellers", "featured", "sale"];
const HOME_COLLECTION_LIMIT = 24;

function apiCollection(query: CatalogQuery): string | undefined {
  const collection = query.collection ?? (query.onSale ? "sale" : null);
  return collection && API_COLLECTIONS.has(collection) ? collection : undefined;
}

/** Newest first, then each collection's products, without duplicates. */
function mergeProducts(...lists: ApiProduct[][]): ApiProduct[] {
  const seen = new Map<string, ApiProduct>();
  for (const product of lists.flat()) if (!seen.has(product.id)) seen.set(product.id, product);
  return [...seen.values()];
}

/**
 * A category without its own image borrows the first image of a product in it
 * (or in one of its direct children), so tiles never render empty.
 */
function withImageFallback(categories: Category[], products: ApiProduct[]): Category[] {
  return categories.map((category) => {
    if (category.image?.url) return category;
    const members = new Set([category.id, ...categories.filter((child) => child.parentId === category.id).map((child) => child.id)]);
    const product = products.find((p) => p.categoryId && members.has(p.categoryId) && p.media?.some((m) => m.media?.url));
    const media = product && [...(product.media ?? [])].sort((a, b) => a.position - b.position).find((m) => m.media?.url)?.media;
    return media ? { ...category, image: media } : category;
  });
}

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
    collection: apiCollection(query),
    sort: SORTS[query.sort],
  };
}

export function createApiCatalogApi(storeHost?: string): CatalogApi {
  return {
    home: async () => {
      const [products, categories, brands, ...collections] = await Promise.all([
        getProducts({ limit: COMPOSE_LIMIT, sort: "newest" }, storeHost),
        getCategories({ limit: COMPOSE_LIMIT }, storeHost),
        getBrands({ limit: COMPOSE_LIMIT }, storeHost),
        // Sections filter by collection on this list, so each collection is
        // fetched by name: a best seller older than the newest 100 still shows.
        ...HOME_COLLECTIONS.map((collection) =>
          getProducts({ limit: HOME_COLLECTION_LIMIT, sort: "newest", collection }, storeHost).catch(() => ({ data: [] as ApiProduct[] })),
        ),
      ]);
      const all = mergeProducts(products.data, ...collections.map((list) => list.data));
      return {
        products: all.map(mapProduct),
        categories: withImageFallback(publicCategories(categories.data), all).map(mapCategory),
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
        // Derived from the total too, so a missing totalPages can never hide the pager.
        pageCount: Math.max(1, response.meta?.totalPages ?? 0, Math.ceil(total / query.pageSize)),
      };
    },

    facets: async (query) => {
      const [categories, brands, products] = await Promise.all([
        getCategories({ limit: COMPOSE_LIMIT }, storeHost),
        getBrands({ limit: COMPOSE_LIMIT }, storeHost),
        // Only for the price range, so one page is enough to bound it.
        getProducts({ limit: COMPOSE_LIMIT, search: query.q || undefined }, storeHost),
      ]);
      const prices = products.data.map((product) => Number.parseFloat(product.sellingPrice));
      return {
        categories: publicCategories(categories.data).map((category) => ({ ...mapCategory(category), count: category.productsCount ?? 0 })),
        brands: brands.data.map((brand) => ({ ...mapBrand(brand), count: brand.productsCount ?? 0 })),
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
      const response = await getCategories({ limit: COMPOSE_LIMIT }, storeHost);
      return publicCategories(response.data).map(mapCategory);
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
