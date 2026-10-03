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

export type PaginationParams = {
  page?: number;
  /** Capped at 100 by the API (50 for a customer's own orders). */
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
