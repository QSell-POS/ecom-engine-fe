import type { CatalogApi } from "../contracts";
import type { CatalogQuery, FacetOption, Paginated, Product, Ref, ReviewSummary, Vertical } from "../types";
import { demoCatalog } from "./catalog-data";

// MOCK catalog API: implements the CatalogApi contract over the demo catalog
// for a store's vertical, with the same semantics the NestJS endpoints must
// provide (filtering, facet counts, sorting, pagination).

const LATENCY_MS = process.env.NODE_ENV === "development" ? 60 : 0;
const delay = <T,>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), LATENCY_MS));

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  return { items: items.slice((current - 1) * pageSize, current * pageSize), total: items.length, page: current, pageSize, pageCount };
}

const onSale = (p: Product) => p.compareAtPrice !== null && p.compareAtPrice > p.price;

type Skip = "category" | "brands" | "price" | null;

function matches(product: Product, query: CatalogQuery, skip: Skip = null) {
  if (query.q) {
    const haystack = `${product.name} ${product.brand.name} ${product.category.name} ${product.tags.join(" ")}`.toLowerCase();
    if (!query.q.toLowerCase().split(/\s+/).filter(Boolean).every((term) => haystack.includes(term))) return false;
  }
  if (skip !== "category" && query.category && product.category.slug !== query.category) return false;
  if (skip !== "brands" && query.brands.length && !query.brands.includes(product.brand.slug)) return false;
  if (skip !== "price" && query.minPrice !== null && product.price < query.minPrice) return false;
  if (skip !== "price" && query.maxPrice !== null && product.price > query.maxPrice) return false;
  if (query.rating !== null && product.rating.average < query.rating) return false;
  if (query.inStock && !product.available) return false;
  if (query.onSale && !onSale(product)) return false;
  if (query.collection === "sale") {
    if (!onSale(product)) return false;
  } else if (query.collection === "new-arrivals" || query.collection === "best-sellers") {
    if (!product.collections.includes(query.collection)) return false;
  }
  // Editorial collections span the whole demo catalog.
  return true;
}

function facetCounts(products: Product[], key: "category" | "brand", all: Ref[]): FacetOption[] {
  return all
    .map((ref) => ({ ...ref, count: products.filter((p) => p[key].slug === ref.slug).length }))
    .filter((option) => option.count > 0);
}

export function createMockCatalogApi(vertical: Vertical): CatalogApi {
  const data = () => demoCatalog(vertical);

  function sorted(products: Product[], sort: CatalogQuery["sort"]) {
    const { sold } = data();
    const list = [...products];
    switch (sort) {
      case "newest":
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "rating":
        return list.sort((a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count);
      case "best-selling":
        return list.sort((a, b) => (sold.get(b.id) ?? 0) - (sold.get(a.id) ?? 0));
      default:
        // Featured: in-stock first, keep merchandising order.
        return list.sort((a, b) => Number(b.available) - Number(a.available));
    }
  }

  return {
    async home() {
      const { products, categories, brands, collections, media } = data();
      return delay({ products, categories, brands, collections, media });
    },

    async listProducts(query) {
      const filtered = data().products.filter((p) => matches(p, query));
      return delay(paginate(sorted(filtered, query.sort), query.page, query.pageSize));
    },

    async facets(query) {
      const { products, categories, brands } = data();
      const prices = products.filter((p) => matches(p, query, "price")).map((p) => p.price);
      return delay({
        categories: facetCounts(products.filter((p) => matches(p, query, "category")), "category", categories),
        brands: facetCounts(products.filter((p) => matches(p, query, "brands")), "brand", brands),
        price: { min: prices.length ? Math.floor(Math.min(...prices)) : 0, max: prices.length ? Math.ceil(Math.max(...prices)) : 0 },
      });
    },

    async getProduct(slug) {
      return delay(data().products.find((p) => p.slug === slug) ?? null);
    },

    async relatedProducts(slug, limit) {
      const { products } = data();
      const product = products.find((p) => p.slug === slug);
      if (!product) return delay([]);
      const sameCategory = products.filter((p) => p.id !== product.id && p.category.slug === product.category.slug);
      const others = products.filter((p) => p.id !== product.id && p.category.slug !== product.category.slug && p.brand.slug === product.brand.slug);
      return delay([...sameCategory, ...others].slice(0, limit));
    },

    async listCategories() {
      return delay(data().categories);
    },
    async getCategory(slug) {
      return delay(data().categories.find((c) => c.slug === slug) ?? null);
    },
    async listBrands() {
      return delay(data().brands);
    },
    async getBrand(slug) {
      return delay(data().brands.find((b) => b.slug === slug) ?? null);
    },

    async listReviews(slug, page) {
      const product = data().products.find((p) => p.slug === slug);
      const reviews = product ? (data().reviews.get(product.id) ?? []) : [];
      const distribution: ReviewSummary["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const review of reviews) distribution[review.rating as 1 | 2 | 3 | 4 | 5] += 1;
      return delay({
        summary: { average: product?.rating.average ?? 0, count: reviews.length, distribution },
        reviews: paginate(reviews, page, 5),
      });
    },
  };
}
