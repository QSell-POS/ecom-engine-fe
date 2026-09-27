import type { CatalogQuery, ProductSort } from "./types";

// Catalog URL format, shared by storefront pages, the mock API and the HTTP
// client (the NestJS endpoint accepts the same parameters):
//   ?q=linen&category=dresses&brand=linea|saltwater&minPrice=50&maxPrice=200
//    &rating=4&inStock=1&onSale=1&sort=price-asc&page=2

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "best-selling", label: "Best selling" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

export const DEFAULT_PAGE_SIZE = 12;

export function createCatalogQuery(patch: Partial<CatalogQuery> = {}): CatalogQuery {
  return {
    q: "",
    category: null,
    brands: [],
    minPrice: null,
    maxPrice: null,
    rating: null,
    inStock: false,
    onSale: false,
    collection: null,
    sort: "featured",
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    ...patch,
  };
}

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

function reader(source: ParamSource) {
  if (source instanceof URLSearchParams) return (key: string) => source.get(key);
  return (key: string) => {
    const value = source[key];
    return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
  };
}

const num = (value: string | null) => {
  if (value === null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

export function parseCatalogQuery(source: ParamSource, base: Partial<CatalogQuery> = {}): CatalogQuery {
  const get = reader(source);
  const sort = get("sort");
  const rating = num(get("rating"));
  return createCatalogQuery({
    ...base,
    q: (get("q") ?? base.q ?? "").slice(0, 100),
    category: get("category") || base.category || null,
    brands: get("brand")?.split("|").filter(Boolean).slice(0, 20) ?? base.brands ?? [],
    minPrice: num(get("minPrice")),
    maxPrice: num(get("maxPrice")),
    rating: rating === null ? null : Math.min(5, Math.max(1, Math.round(rating))),
    inStock: get("inStock") === "1",
    onSale: get("onSale") === "1",
    collection: get("collection") || base.collection || null,
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? (sort as ProductSort) : (base.sort ?? "featured"),
    page: Math.max(1, Math.floor(num(get("page")) ?? 1)),
    pageSize: Math.min(48, Math.max(1, Math.floor(num(get("pageSize")) ?? base.pageSize ?? DEFAULT_PAGE_SIZE))),
  });
}

/** Only non-default values, so URLs stay short and readable. */
export function serializeCatalogQuery(query: CatalogQuery, omit: (keyof CatalogQuery)[] = []): URLSearchParams {
  const params = new URLSearchParams();
  const skip = new Set(omit);
  if (query.q && !skip.has("q")) params.set("q", query.q);
  if (query.category && !skip.has("category")) params.set("category", query.category);
  if (query.brands.length && !skip.has("brands")) params.set("brand", query.brands.join("|"));
  if (query.minPrice !== null) params.set("minPrice", String(query.minPrice));
  if (query.maxPrice !== null) params.set("maxPrice", String(query.maxPrice));
  if (query.rating !== null) params.set("rating", String(query.rating));
  if (query.inStock) params.set("inStock", "1");
  if (query.onSale) params.set("onSale", "1");
  if (query.collection && !skip.has("collection")) params.set("collection", query.collection);
  if (query.sort !== "featured") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  if (query.pageSize !== DEFAULT_PAGE_SIZE && !skip.has("pageSize")) params.set("pageSize", String(query.pageSize));
  return params;
}

export function activeFilterCount(query: CatalogQuery, fixed: (keyof CatalogQuery)[] = []) {
  const skip = new Set(fixed);
  return (
    (query.category && !skip.has("category") ? 1 : 0) +
    (skip.has("brands") ? 0 : query.brands.length) +
    (query.minPrice !== null || query.maxPrice !== null ? 1 : 0) +
    (query.rating !== null ? 1 : 0) +
    (query.inStock ? 1 : 0) +
    (query.onSale ? 1 : 0)
  );
}
