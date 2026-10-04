import "server-only";
import { cache } from "react";
import { apiClient, apiList } from "@/lib/api/client";
import { getStorefrontTheme } from "@/lib/api/storefront/theme";
import { getStoreHost } from "@/lib/api/store-host";
import { getCurrentTenant as getTenantFromApi } from "@/lib/api/auth/service";
import { demoStoreProfile } from "@/lib/storefront/mock/catalog-data";
import type { StoreProfile } from "@/lib/storefront/types";
import { DEMO_STORE_PREFIX, getPreset } from "@/lib/theme-engine/presets";
import type { ThemeDocument } from "@/lib/theme-engine/types";
import type { ResolvedStorefront, Tenant, Theme, ThemeSummary } from "./types";

/**
 * Themes, against the real API. Every admin route resolves the tenant from the
 * owner JWT, so the `tenantId` arguments these functions still take are
 * ignored — they are kept so the ten call sites did not have to change, and
 * can go when something else touches them.
 *
 * The local JSON store this used to read is gone.
 */

export async function listTenants(): Promise<Tenant[]> {
  // Multi-tenant switching was a mock-mode affordance: a session is one tenant.
  return [await getCurrentTenant()];
}

/**
 * The signed-in merchant, as the theme screens want it. Deduplicated per
 * request: the customizer, the editor and the previews each ask for it.
 *
 * `liveThemeId` comes from the themes list — the API marks the live one with
 * `isLive` rather than carrying an id on the tenant. Getting this wrong makes
 * every theme screen behave as though no theme is installed.
 */
export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  const [tenant, profile, themes] = await Promise.all([getTenantFromApi(), getStoreProfile(), listThemes()]);
  const slug = tenant.subdomain ?? tenant.id;

  return {
    id: tenant.id,
    name: tenant.name,
    slug,
    // The dashboard reads the catalog with its own credentials; this is the
    // host its storefront previews are about.
    apiKey: tenant.storefrontHost ?? slug,
    plan: "standard",
    themeLimit: THEME_LIMIT,
    liveThemeId: themes.find((theme) => theme.isLive)?.id ?? null,
    vertical: "fashion",
    profile,
  };
});

/** Matches the API's THEME_LIMIT default; it is not a per-tenant column yet. */
export const THEME_LIMIT = 5;

/** The published theme a merchant's store is serving, if they have chosen one. */
export async function getLiveTheme(): Promise<Theme | null> {
  const live = (await listThemes()).find((theme) => theme.isLive);
  return live ? getTheme("", live.id) : null;
}

export async function listThemes(): Promise<ThemeSummary[]> {
  const response = await apiList<ThemeSummary>("/admin/themes", { auth: "owner", tags: [THEMES_TAG], revalidate: 30 });
  return response.data;
}

export async function getTheme(_tenantId: string, themeId: string): Promise<Theme | null> {
  return apiClient<Theme>(`/admin/themes/${themeId}`, { auth: "owner", tags: [themeTag(themeId)], revalidate: 30, allow404: true });
}

/** 403 at the theme limit. `publish: true` makes the store live in one go. */
export async function createThemeFromPreset(_tenantId: string, presetId: string, publish = false): Promise<Theme> {
  return apiClient<Theme>("/admin/themes", { method: "POST", body: { presetId, publish }, auth: "owner" });
}

export async function duplicateTheme(_tenantId: string, themeId: string): Promise<Theme> {
  return apiClient<Theme>(`/admin/themes/${themeId}/duplicate`, { method: "POST", auth: "owner" });
}

export async function deleteTheme(_tenantId: string, themeId: string): Promise<void> {
  // 409 if it is the live theme.
  await apiClient<null>(`/admin/themes/${themeId}`, { method: "DELETE", auth: "owner" });
}

/**
 * The builder's save. `expectedRevision` is how two open tabs avoid clobbering
 * each other: pass the revision the editor loaded and a mismatch is a 409.
 */
export async function saveThemeDraft(
  _tenantId: string,
  themeId: string,
  document: ThemeDocument,
  options: { name?: string; expectedRevision?: number } = {},
): Promise<Theme> {
  return apiClient<Theme>(`/admin/themes/${themeId}/draft`, {
    method: "PUT",
    body: { document, ...options },
    auth: "owner",
  });
}

export async function publishTheme(_tenantId: string, themeId: string, body: { document?: ThemeDocument; name?: string } = {}): Promise<Theme> {
  return apiClient<Theme>(`/admin/themes/${themeId}/publish`, { method: "POST", body, auth: "owner" });
}

/** "Use this theme": install and publish in one transaction. */
export async function installTheme(tenantId: string, presetId: string): Promise<Theme> {
  return createThemeFromPreset(tenantId, presetId, true);
}

export async function listThemeVersions(themeId: string) {
  const response = await apiList<{ id: string; publishedAt: string; name?: string }>(`/admin/themes/${themeId}/versions`, {
    auth: "owner",
    revalidate: false,
  });
  return response.data;
}

/** Restores into the draft — never straight onto the live store. */
export async function restoreThemeVersion(themeId: string, versionId: string): Promise<Theme> {
  return apiClient<Theme>(`/admin/themes/${themeId}/versions/${versionId}/restore`, { method: "POST", auth: "owner" });
}

export async function getStoreProfile(): Promise<StoreProfile> {
  return apiClient<StoreProfile>("/admin/store/profile", { auth: "owner", tags: [PROFILE_TAG], revalidate: 60 });
}

export async function updateStoreProfile(_tenantId: string, input: unknown): Promise<StoreProfile> {
  return apiClient<StoreProfile>("/admin/store/profile", { method: "PUT", body: input, auth: "owner" });
}

/**
 * The simple customizer. Writes to draft **and** published, so a colour change
 * is live at once — its users are merchants who never open the builder.
 */
export async function updateBrandStyle(_tenantId: string, themeId: string, patch: Record<string, unknown>): Promise<Theme> {
  return apiClient<Theme>(`/admin/themes/${themeId}/brand`, { method: "PATCH", body: patch, auth: "owner" });
}

export async function listThemePresets() {
  const response = await apiList<{ id: string; name: string }>("/admin/theme-presets", { auth: "owner", revalidate: 300 });
  return response.data;
}

// ---- Public storefront resolution

/**
 * What `/store/:slug` renders. A `demo-<presetId>` slug is a theme-store demo
 * and stays local; everything else is the real store for this request's host.
 *
 * `/storefront/theme` answers with the default preset rather than a 404 when a
 * merchant has published nothing, so a new store is a page rather than an
 * error — `theme.id === null` is how to tell.
 */
export async function resolveStorefront(slug: string): Promise<ResolvedStorefront | null> {
  if (slug.startsWith(DEMO_STORE_PREFIX)) {
    const preset = getPreset(slug.slice(DEMO_STORE_PREFIX.length));
    if (!preset) return null;
    return {
      slug,
      storeKey: slug,
      vertical: preset.vertical,
      profile: demoStoreProfile(preset.vertical, preset.demo.storeName, preset.demo.tagline),
      document: preset.build(),
      mode: "demo",
      theme: { id: null, name: preset.name, presetId: preset.id },
    };
  }

  const host = await getStoreHost();
  const resolved = await getStorefrontTheme(host);
  if (!resolved) return null;

  return {
    slug: resolved.store.slug || slug,
    storeKey: host ?? resolved.store.slug,
    vertical: "fashion",
    profile: resolved.store.profile,
    document: resolved.theme.document,
    mode: "live",
    theme: { id: resolved.theme.id, name: resolved.theme.name, presetId: resolved.theme.presetId },
  };
}

export const THEMES_TAG = "themes";
export const PROFILE_TAG = "store-profile";
export const themeTag = (id: string) => `theme-${id}`;
