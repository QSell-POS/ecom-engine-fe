import { PRODUCT_BADGES, productBadgeLabel, type ProductBadge } from "@/lib/api/product/types";
import type { ThemeDocument } from "./types";

/**
 * Where a Product grid section takes its products from, stored as one string in
 * the section's `collection` setting so themes saved before badges, categories
 * and brands were selectable keep working unchanged:
 *
 *   all | sale | new-arrivals | best-sellers | …   a named collection (as before)
 *   badge:<badge>                                   every product with that badge
 *   category:<slug>                                 a category (and its subcategories)
 *   brand:<slug>                                    a brand
 */
export type ProductSource =
  | { kind: "collection"; slug: string }
  | { kind: "badge"; badge: ProductBadge }
  | { kind: "category"; slug: string }
  | { kind: "brand"; slug: string };

/** Named collections, in the order the builder lists them. */
export const COLLECTION_OPTIONS = [
  { value: "all", label: "All products" },
  { value: "new-arrivals", label: "New arrivals" },
  { value: "best-sellers", label: "Best sellers" },
  { value: "sale", label: "On sale" },
];

export const BADGE_SOURCE_OPTIONS = PRODUCT_BADGES.map((badge) => ({ value: `badge:${badge}`, label: productBadgeLabel(badge) }));

const SLUG = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i;
const BADGES = new Set<string>(PRODUCT_BADGES);
const COLLECTIONS = new Set(COLLECTION_OPTIONS.map((option) => option.value));

export function parseProductSource(value: unknown): ProductSource | null {
  if (typeof value !== "string" || value.length > 120) return null;
  const at = value.indexOf(":");
  if (at === -1) return COLLECTIONS.has(value) ? { kind: "collection", slug: value } : null;
  const kind = value.slice(0, at);
  const rest = value.slice(at + 1);
  if (kind === "badge") return BADGES.has(rest) ? { kind, badge: rest as ProductBadge } : null;
  if ((kind === "category" || kind === "brand") && SLUG.test(rest)) return { kind, slug: rest };
  return null;
}

export function isProductSource(value: unknown): value is string {
  return parseProductSource(value) !== null;
}

/** The storefront page that lists everything in a source ("View all"). */
export function productSourceHref(value: string): string {
  const source = parseProductSource(value);
  if (!source) return "/products";
  switch (source.kind) {
    case "collection":
      return source.slug === "all" ? "/products" : `/products?collection=${source.slug}`;
    case "badge":
      return `/products?collection=badge:${source.badge}`;
    case "category":
      return `/products?category=${encodeURIComponent(source.slug)}`;
    case "brand":
      return `/products?brand=${encodeURIComponent(source.slug)}`;
  }
}

/** Every product source the document's Product grid sections use, so the page can fetch exactly those. */
export function productSourcesIn(document: ThemeDocument): string[] {
  const sources = new Set<string>();
  for (const section of document.sections) {
    if (section.type !== "products") continue;
    const value = section.settings.collection;
    if (typeof value === "string" && isProductSource(value)) sources.add(value);
  }
  return [...sources];
}
