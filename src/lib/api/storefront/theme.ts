import "server-only";
import { apiClient } from "@/lib/api/client";
import { getStoreHost } from "@/lib/api/store-host";
import type { ThemeDocument } from "@/lib/theme-engine/types";
import type { StoreProfile } from "@/lib/storefront/types";

/**
 * The published theme and store profile for the store this request is about.
 * One call renders a shop.
 *
 * It does **not** 404 when a merchant has published nothing: it answers with
 * the default preset and `source: "default-preset"`, so a new store is a real
 * page rather than an error. Branch on `source`, and treat `theme.id === null`
 * as "this merchant has not chosen a theme yet" — that is what the "make it
 * yours" checklist keys off, not the status code.
 */
export type StorefrontThemeSource = "published" | "default-preset";

export type StorefrontTheme = {
  store: {
    id: string;
    slug: string;
    name: string;
    profile: StoreProfile;
  };
  theme: {
    id: string | null;
    name: string;
    presetId: string;
    schemaVersion?: number;
    publishedAt?: string | null;
    source: StorefrontThemeSource;
    document: ThemeDocument;
  };
};

export const storefrontThemeTag = (host: string) => `storefront-theme:${host}`;

export async function getStorefrontTheme(host?: string): Promise<StorefrontTheme | null> {
  const storeHost = host ?? (await getStoreHost());
  if (!storeHost) return null;

  return apiClient<StorefrontTheme>("/storefront/theme", {
    auth: "key",
    storeHost,
    // Identical for every shopper of a store, and the hottest route there is.
    // Tagged per host so a publish can drop just that store's copy.
    tags: [storefrontThemeTag(storeHost)],
    revalidate: 60,
    allow404: true,
  });
}

/** True when the merchant has published a theme of their own. */
export function hasOwnTheme(theme: StorefrontTheme | null): boolean {
  return Boolean(theme && theme.theme.id !== null && theme.theme.source === "published");
}
