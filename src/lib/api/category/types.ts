import type { MediaRef } from "@/lib/api/shared/types";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  parent?: Category | null;
  position?: number | null;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
  /**
   * Reads return both: `imageId` is the asset id, `image` the resolved object
   * (null when there is none). Writes send `imageId`.
   */
  imageId?: string | null;
  image?: MediaRef | null;
  /** Active products in this category and its direct children; public reads only. */
  productsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Categories `excludeId` may be placed under, labelled with their full path
 * ("Kids › T-Shirts"). The category itself and everything below it are left
 * out — the API rejects a move that would create a cycle.
 */
export function parentCategoryOptions(categories: Category[], excludeId?: string): { id: string; name: string }[] {
  const byId = new Map(categories.map((category) => [category.id, category]));

  function path(category: Category): Category[] {
    const chain: Category[] = [];
    const seen = new Set<string>();
    for (let node: Category | undefined = category; node && !seen.has(node.id); node = node.parentId ? byId.get(node.parentId) : undefined) {
      seen.add(node.id);
      chain.unshift(node);
    }
    return chain;
  }

  return categories
    .map((category) => ({ category, chain: path(category) }))
    .filter(({ chain }) => !excludeId || !chain.some((node) => node.id === excludeId))
    .map(({ category, chain }) => ({ id: category.id, name: chain.map((node) => node.name).join(" › ") }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
