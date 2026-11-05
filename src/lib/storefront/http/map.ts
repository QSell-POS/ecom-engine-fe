import type { Brand as ApiBrand } from "@/lib/api/brand/types";
import type { Category as ApiCategory } from "@/lib/api/category/types";
import type { Product as ApiProduct } from "@/lib/api/product/types";
import type { Review as ApiReview } from "@/lib/api/review/types";
import { toAmount } from "@/lib/api/shared/types";
import type { Brand, Category, Product, Ref, Review, ReviewSummary, StoreImage } from "../types";
import { availableStock, inStockNow, type ProductBadge } from "@/lib/api/product/types";
import { slugify } from "../format";

/**
 * Translates API resources into the storefront's own model.
 *
 * The two do not line up exactly, and the gaps are filled honestly rather than
 * invented:
 *
 * - **Variants and options.** The API has one price per product, so each maps
 *   to a single variant. Themes that render a size or colour picker get one
 *   choice, which is the truth.
 * - **Stock numbers.** The storefront view reports stock as a boolean, so the
 *   variant's `inventory` is 1 or 0 — enough for "add to cart" or "sold out",
 *   not for "only 3 left".
 * - **Ratings.** List payloads carry no aggregate, so `rating` is 0/0 until a
 *   product page loads its reviews and fills it in.
 * - **Collections.** Derived from badges (see COLLECTION_BADGES), so home
 *   sections like "New arrivals" find their products.
 * - **Highlights.** No backend equivalent; left empty.
 */

/**
 * Storefront collection slugs and the API badges that put a product in them.
 * Mirrors the API's own mapping for `?collection=`; `sale` is price-based and
 * handled where products are filtered.
 */
export const COLLECTION_BADGES: Record<string, readonly ProductBadge[]> = {
  "new-arrivals": ["new_arrival"],
  "best-sellers": ["best_seller", "top_selling"],
  featured: ["featured"],
  trending: ["trending"],
  deals: ["deal_of_the_day", "hot_deal"],
  clearance: ["clearance"],
};

function collectionsFor(badges: readonly string[] | undefined): string[] {
  if (!badges?.length) return [];
  return Object.entries(COLLECTION_BADGES)
    .filter(([, members]) => members.some((badge) => badges.includes(badge)))
    .map(([slug]) => slug);
}

const PLACEHOLDER: StoreImage = { url: "", alt: "" };

function images(product: ApiProduct): StoreImage[] {
  const sorted = [...(product.media ?? [])].sort((a, b) => a.position - b.position);
  const mapped = sorted.map((entry) => ({ url: entry.media.url, alt: entry.media.alt ?? product.name }));
  return mapped.length > 0 ? mapped : [PLACEHOLDER];
}

function ref(value: { id: string; name: string; slug?: string | null } | null | undefined): Ref {
  return { id: value?.id ?? "", slug: value?.slug || slugify(value?.name ?? ""), name: value?.name ?? "" };
}

export function mapProduct(product: ApiProduct): Product {
  const price = toAmount(product.sellingPrice);
  const compareAtPrice = product.compareAtPrice ? toAmount(product.compareAtPrice) : null;
  const available = inStockNow(product);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? "",
    highlights: [],
    brand: ref(product.brand),
    category: ref(product.category),
    collections: collectionsFor(product.badges),
    tags: (product.tags ?? []).map((tag) => tag.name),
    images: images(product),
    price,
    compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : null,
    // One option set per attribute, for themes that render swatches.
    options: (product.attributes ?? []).map((attribute) => ({
      name: attribute.name,
      values: attribute.values.map((value) => ({ value })),
    })),
    // A single variant, because that is all the API models.
    variants: [
      {
        id: product.id,
        title: product.name,
        options: {},
        sku: product.sku ?? "",
        price,
        compareAtPrice,
        // The storefront view carries no counts, only a boolean, so a
        // theme's "3 left" badge has nothing to show. 1 means "buyable".
        inventory: product.inventory ? availableStock(product) : available ? 1 : 0,
      },
    ],
    rating: { average: 0, count: 0 },
    badges: mapBadges(product, available),
    available,
    createdAt: product.createdAt ?? new Date(0).toISOString(),
  };
}

function mapBadges(product: ApiProduct, available: boolean): Product["badges"] {
  const badges: Product["badges"] = [];
  if (!available) badges.push("sold-out");
  if (product.compareAtPrice && toAmount(product.compareAtPrice) > toAmount(product.sellingPrice)) badges.push("sale");
  if (product.badges?.includes("new_arrival")) badges.push("new");
  if (product.badges?.some((badge) => badge === "best_seller" || badge === "top_selling")) badges.push("bestseller");
  return badges;
}

export function mapCategory(category: ApiCategory): Category {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description ?? "",
    image: category.image ? { url: category.image.url, alt: category.image.alt ?? category.name } : PLACEHOLDER,
    productCount: category.productsCount ?? 0,
  };
}

export function mapBrand(brand: ApiBrand): Brand {
  return {
    id: brand.id,
    // A brand link built from a missing slug was /brands/undefined.
    slug: brand.slug || slugify(brand.name),
    name: brand.name,
    description: brand.description ?? "",
    image: brand.logo ? { url: brand.logo.url, alt: brand.logo.alt ?? brand.name } : PLACEHOLDER,
    productCount: brand.productsCount ?? 0,
  };
}

/** The storefront list carries no reviewer, so every review is anonymous. */
export function mapReview(review: ApiReview): Review {
  return {
    id: review.id,
    productId: review.productId,
    author: "Verified buyer",
    rating: review.rating,
    title: "",
    body: review.comment ?? "",
    createdAt: review.createdAt ?? new Date(0).toISOString(),
    // Only buyers can review, so this is always true on the storefront.
    verified: review.isVerifiedBuyer ?? true,
  };
}

/** Derived here, because the API exposes no ratings aggregate. */
export function summarise(reviews: Review[]): ReviewSummary {
  const distribution: ReviewSummary["distribution"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) {
    const bucket = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[bucket] += 1;
  }
  const count = reviews.length;
  const average = count === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / count;
  return { average: Math.round(average * 10) / 10, count, distribution };
}
