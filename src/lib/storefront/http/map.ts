import type { Brand as ApiBrand } from "@/lib/api/brand/types";
import type { Category as ApiCategory } from "@/lib/api/category/types";
import type { Product as ApiProduct } from "@/lib/api/product/types";
import type { Review as ApiReview } from "@/lib/api/review/types";
import { toAmount } from "@/lib/api/shared/types";
import type { Brand, Category, Product, Ref, Review, ReviewSummary, StoreImage } from "../types";

/**
 * Translates API resources into the storefront's own model.
 *
 * The two do not line up exactly, and the gaps are filled honestly rather than
 * invented:
 *
 * - **Variants and options.** The API has one price and one stock figure per
 *   product, so each product maps to a single variant carrying them. Themes
 *   that render a size or colour picker get one choice, which is the truth.
 * - **Ratings.** List payloads carry no aggregate, so `rating` is 0/0 until a
 *   product page loads its reviews and fills it in.
 * - **Collections and highlights.** No backend equivalent; left empty.
 */

const PLACEHOLDER: StoreImage = { url: "", alt: "" };

function images(product: ApiProduct): StoreImage[] {
  const sorted = [...(product.media ?? [])].sort((a, b) => a.position - b.position);
  const mapped = sorted.map((entry) => ({ url: entry.media.url, alt: entry.media.alt ?? product.name }));
  return mapped.length > 0 ? mapped : [PLACEHOLDER];
}

function ref(value: { id: string; name: string; slug?: string } | null | undefined): Ref {
  return { id: value?.id ?? "", slug: value?.slug ?? "", name: value?.name ?? "" };
}

export function mapProduct(product: ApiProduct): Product {
  const price = toAmount(product.sellingPrice);
  const compareAtPrice = product.compareAtPrice ? toAmount(product.compareAtPrice) : null;
  const available = (product.inventory?.available ?? 0) > 0;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description ?? "",
    highlights: [],
    brand: ref(product.brand),
    category: ref(product.category),
    collections: [],
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
        sku: product.sku,
        price,
        compareAtPrice,
        inventory: product.inventory?.available ?? 0,
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
    // The list payload carries no count; themes that show one get 0.
    productCount: 0,
  };
}

export function mapBrand(brand: ApiBrand): Brand {
  return {
    id: brand.id,
    slug: brand.slug,
    name: brand.name,
    description: brand.description ?? "",
    image: brand.logo ? { url: brand.logo.url, alt: brand.logo.alt ?? brand.name } : PLACEHOLDER,
    productCount: 0,
  };
}

export function mapReview(review: ApiReview): Review {
  return {
    id: review.id,
    productId: review.productId,
    author: [review.customer?.firstName, review.customer?.lastName].filter(Boolean).join(" ") || "Anonymous",
    rating: review.rating,
    title: "",
    body: review.comment ?? "",
    createdAt: review.createdAt ?? new Date(0).toISOString(),
    verified: Boolean(review.isVerifiedBuyer),
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
