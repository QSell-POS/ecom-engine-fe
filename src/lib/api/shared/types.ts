/**
 * Page-paginated lists carry `{ total, page, limit, totalPages }`. The chat
 * message route is the one exception: it is cursor-paginated and sends
 * `{ nextCursor, hasMore }` instead.
 */
export type PageMeta = { total: number; page: number; limit: number; totalPages: number };
export type CursorMeta = { nextCursor: string | null; hasMore: boolean };

export type ListResponse<T> = {
  data: T[];
  meta?: Partial<PageMeta> & Partial<CursorMeta>;
};

/** The API rejects anything larger with a 400, it does not clamp. */
export const MAX_PAGE_LIMIT = 100;
/** Tighter on a customer's own order history. */
export const MAX_CUSTOMER_ORDER_LIMIT = 50;

export type PaginationParams = {
  page?: number;
  /** Capped at MAX_PAGE_LIMIT by the API. */
  limit?: number;
  search?: string;
};

/** Pagination plus any endpoint-specific filters (status, ids, flags…). */
export type ListParams = PaginationParams & Record<string, string | number | boolean | undefined | null>;

/**
 * `?page=1&limit=20&status=pending` from a params object. Undefined, null and
 * "" are dropped so callers can spread optional filters without guards.
 */
export function buildQuery(params?: ListParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    // The API returns 400 for limit > 100 rather than clamping, so clamp here:
    // one oversized page size would otherwise take a whole screen down.
    if (key === "limit") {
      search.set(key, String(Math.min(Number(value) || MAX_PAGE_LIMIT, MAX_PAGE_LIMIT)));
      continue;
    }
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

/**
 * Money is not one type across this API: product prices are decimal strings
 * ("1299.00") so cents never pass through a float, while order totals are
 * numbers. Parse before doing arithmetic.
 */
export type Decimal = string;

export function toAmount(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const amount = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
}

/** An uploaded image as the API embeds it on products, brands and categories. */
export type MediaRef = {
  id?: string;
  url: string;
  alt?: string | null;
  title?: string | null;
  width?: number | null;
  height?: number | null;
};

export function mediaUrl(media?: MediaRef | null): string | undefined {
  return media?.url || undefined;
}

/**
 * A shopper's delivery address. `region` and `city` must match a configured
 * delivery rate, or checkout has no shipping cost to apply.
 */
export type AddressLabel = "HOME" | "OFFICE" | "OTHER";

export type Address = {
  id: string;
  region: string;
  city: string;
  area: string;
  buildingStreet: string;
  address: string;
  landmark?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  label?: AddressLabel;
  isDefaultShipping?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** Formats an address into one line for tables and detail panes. */
export function formatAddress(address?: Partial<Address> | null): string {
  if (!address) return "";
  if (address.address) return address.address;
  return [address.buildingStreet, address.area, address.city, address.region, address.postalCode].filter(Boolean).join(", ");
}

/**
 * Walks a paginated endpoint and returns every row.
 *
 * The admin grids filter and sort in the browser, so they want the whole set,
 * but the API caps a page at 100. This pages through until it has everything
 * or hits `max` — a ceiling, so a tenant with 50,000 products cannot hang the
 * page; past that, the grid wants a server-side data source instead.
 */
export async function loadAllPages<T>(
  load: (params: ListParams) => Promise<ListResponse<T>>,
  { max = 1000, limit = MAX_PAGE_LIMIT, ...params }: ListParams & { max?: number } = {},
): Promise<T[]> {
  const first = await load({ ...params, page: 1, limit });
  const rows = [...first.data];

  const totalPages = first.meta?.totalPages ?? 1;
  const lastPage = Math.min(totalPages, Math.ceil(max / limit));

  for (let page = 2; page <= lastPage; page += 1) {
    const next = await load({ ...params, page, limit });
    rows.push(...next.data);
    if (next.data.length < limit) break;
  }

  return rows;
}
