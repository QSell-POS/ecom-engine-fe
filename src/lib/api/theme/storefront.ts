import "server-only";
import { cache } from "react";
import { resolveStorefront } from "./service";

/**
 * The storefront for this request, deduplicated across the layout and page.
 *
 * Only published work is served here. `/storefront/theme` returns the
 * published document or the default preset, and never a draft — a draft is
 * previewed in the builder's own canvas, where it cannot leak to a shopper.
 */
export const getStorefront = cache(async (slug: string) => resolveStorefront(slug));
