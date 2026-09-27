import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { PREVIEW_COOKIE } from "./constants";
import { getCurrentTenant, resolveStorefront } from "./service";

/**
 * The storefront for this request, deduplicated across the layout and page.
 * A draft preview is honoured only for the signed-in admin of that store, so
 * a guessed theme id never exposes unpublished work to customers.
 */
export const getStorefront = cache(async (slug: string) => {
  let previewThemeId: string | null = null;
  if (!slug.startsWith("demo-")) {
    const requested = (await cookies()).get(PREVIEW_COOKIE)?.value;
    if (requested && (await getCurrentTenant()).slug === slug) previewThemeId = requested;
  }
  return resolveStorefront(slug, previewThemeId);
});
