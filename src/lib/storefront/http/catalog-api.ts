import "server-only";
import { getBrandBySlug, getBrands } from "@/lib/api/brand/service";
import { getCategories, getCategoriesBySlug } from "@/lib/api/category/service";
import { getProductBySlug, getProducts } from "@/lib/api/product/service";
import { getProductReviews } from "@/lib/api/review/service";
import type { CatalogApi } from "../contracts";
import type { CatalogQuery, Paginated, Product } from "../types";
import { demoCatalog } from "../mock/catalog-data";
import { mapBrand, mapCategory, mapProduct, mapReview, summarise } from "./map";

/**
 * The storefront's catalog, served by the real API.
 *
 * Two things the API does not do, done here instead:
 *
 * - **Filtering and sorting.** `/products` takes `search`, `brandId` and
 *   `categoryId` only, so price, rating, in-stock, on-sale and every sort
 *   order are applied to the fetched page in this process. Pages are
 *   therefore requested large and narrowed locally; a catalog past a few
 *   hundred products wants these pushed into the API.
 * - **`home` and `facets`.** Neither exists as an endpoint. They are composed
 *   from the product, category and brand lists.
 *
 * Runs server-side only: it reaches the API through `apiClient`, whose key
 * never leaves the server.
 */
const FETCH_LIMIT = 100;

export function createApiCatalogApi(): CatalogApi {
  async function allProducts(query?: { search?: string }): Promise<Product[]> {
    const response = await getProducts({ limit: FETCH_LIMIT, isActive: true, ...query });
    return response.data.map(mapProduct);
  }

  function narrow(products: Product[], query: CatalogQuery): Product[] {
    let rows = products;
    if (query.category) rows = rows.filter((product) => product.category.slug === query.category);
    if (query.brands.length > 0) rows = rows.filter((product) => query.brands.includes(product.brand.slug));
    if (query.minPrice !== null) rows = rows.filter((product) => product.price >= query.minPrice!);
    if (query.maxPrice !== null) rows = rows.filter((product) => product.price <= query.maxPrice!);
    if (query.inStock) rows = rows.filter((product) => product.available);
    if (query.onSale) rows = rows.filter((product) => product.compareAtPrice !== null);
    // `rating` and `collection` are not filtered: the API carries neither, so
    // filtering on them would silently drop everything.
    return sort(rows, query.sort);
  }

  function sort(products: Product[], order: CatalogQuery["sort"]): Product[] {
    const rows = [...products];
    switch (order) {
      case "price-asc":
        return rows.sort((a, b) => a.price - b.price);
      case "price-desc":
        return rows.sort((a, b) => b.price - a.price);
      case "newest":
        return rows.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      case "rating":
      case "best-selling":
      case "featured":
      default:
        // No ranking signal from the API; keep its order.
        return rows;
    }
  }

  function paginate(rows: Product[], query: CatalogQuery): Paginated<Product> {
    const start = (query.page - 1) * query.pageSize;
    return {
      items: rows.slice(start, start + query.pageSize),
      total: rows.length,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(rows.length / query.pageSize)),
    };
  }

  return {
    home: async () => {
      const [products, categories, brands] = await Promise.all([
        allProducts(),
        getCategories({ limit: FETCH_LIMIT, isActive: true, sortBy: "position", sortOrder: "ASC" }),
        getBrands({ limit: FETCH_LIMIT }),
      ]);
      return {
        products,
        categories: categories.data.map(mapCategory),
        brands: brands.data.map(mapBrand),
        // No backend equivalent; the demo set keeps theme sections renderable.
        collections: [],
        media: demoCatalog("fashion").media,
      };
    },

    listProducts: async (query) => paginate(narrow(await allProducts({ search: query.q || undefined }), query), query),

    facets: async (query) => {
      const [categories, brands, products] = await Promise.all([
        getCategories({ limit: FETCH_LIMIT, isActive: true }),
        getBrands({ limit: FETCH_LIMIT }),
        allProducts({ search: query.q || undefined }),
      ]);
      const prices = products.map((product) => product.price);
      return {
        categories: categories.data.map((category) => ({ ...mapCategory(category), count: 0 })),
        brands: brands.data.map((brand) => ({ ...mapBrand(brand), count: 0 })),
        price: { min: prices.length ? Math.floor(Math.min(...prices)) : 0, max: prices.length ? Math.ceil(Math.max(...prices)) : 0 },
      };
    },

    getProduct: async (slug) => {
      const product = await getProductBySlug(slug);
      if (!product) return null;
      const mapped = mapProduct(product);
      // Fill in the rating the list payload cannot carry.
      const reviews = await getProductReviews(product.id, { limit: FETCH_LIMIT }).catch(() => ({ data: [] }));
      const summary = summarise(reviews.data.map(mapReview));
      return { ...mapped, rating: { average: summary.average, count: summary.count } };
    },

    relatedProducts: async (slug, limit) => {
      const product = await getProductBySlug(slug);
      if (!product?.categoryId) return [];
      const response = await getProducts({ limit: limit + 1, categoryId: product.categoryId, isActive: true });
      return response.data
        .filter((candidate) => candidate.id !== product.id)
        .slice(0, limit)
        .map(mapProduct);
    },

    listCategories: async () => {
      const response = await getCategories({ limit: FETCH_LIMIT, isActive: true, sortBy: "position", sortOrder: "ASC" });
      return response.data.map(mapCategory);
    },

    getCategory: async (slug) => {
      const category = await getCategoriesBySlug(slug);
      return category ? mapCategory(category) : null;
    },

    listBrands: async () => {
      const response = await getBrands({ limit: FETCH_LIMIT });
      return response.data.map(mapBrand);
    },

    getBrand: async (slug) => {
      const brand = await getBrandBySlug(slug);
      return brand ? mapBrand(brand) : null;
    },

    listReviews: async (slug, page) => {
      const product = await getProductBySlug(slug);
      if (!product) return { summary: summarise([]), reviews: { items: [], total: 0, page, pageSize: 10, pageCount: 1 } };

      const response = await getProductReviews(product.id, { page, limit: 10 });
      const reviews = response.data.map(mapReview);
      const total = response.meta?.total ?? reviews.length;
      return {
        // Summarised from this page when the API sends no aggregate.
        summary: summarise(reviews),
        reviews: { items: reviews, total, page, pageSize: 10, pageCount: response.meta?.totalPages ?? 1 },
      };
    },
  };
}
