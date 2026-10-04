import type { StoreProfile, Vertical } from "@/lib/storefront/types";
import type { ThemeDocument } from "@/lib/theme-engine/types";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  /** Public storefront key: resolves the tenant on headless/storefront API calls. */
  apiKey: string;
  plan: string;
  themeLimit: number;
  liveThemeId: string | null;
  /** Demo catalog used until the store has products (mock mode). */
  vertical: Vertical;
  /** Merchant identity shown by every theme: name, logo, contact, social… */
  profile: StoreProfile;
};

/**
 * A tenant-owned theme. `draft` is the editor's working copy; `published` is
 * the snapshot customers see once this theme is the tenant's live theme.
 */
export type Theme = {
  id: string;
  tenantId: string;
  name: string;
  presetId: string | null;
  draft: ThemeDocument;
  published: ThemeDocument | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type ThemeSummary = Omit<Theme, "published"> & {
  isLive: boolean;
  hasUnpublishedChanges: boolean;
};

/** What a storefront request renders: resolved from the URL slug (and a preview cookie). */
export type ResolvedStorefront = {
  slug: string;
  /** Public key for the storefront APIs (demo stores use a demo key). */
  storeKey: string;
  /** The store's host, sent as `x-store-host` on catalog reads. Absent for demo stores. */
  host?: string;
  vertical: Vertical;
  profile: StoreProfile;
  document: ThemeDocument;
  mode: "live" | "preview" | "demo";
  theme: { id: string | null; name: string; presetId: string | null };
};
