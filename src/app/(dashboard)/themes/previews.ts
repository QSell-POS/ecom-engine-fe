import "server-only";
import type { ThumbnailStore } from "@/components/themes/ThemeThumbnail";
import type { Tenant } from "@/lib/api/theme";
import { demoStoreProfile } from "@/lib/storefront/mock/catalog-data";
import { getCatalogApi } from "@/lib/storefront/server";
import { demoStoreSlug, type ThemePreset } from "@/lib/theme-engine/presets";

// Data for live theme thumbnails in the admin: demo stores for theme-store
// presets, and the merchant's own store for installed themes.

export async function presetPreview(preset: ThemePreset) {
  const slug = demoStoreSlug(preset.id);
  const data = await getCatalogApi({ storeKey: slug, vertical: preset.vertical }).home();
  const store: ThumbnailStore = {
    slug,
    storeKey: slug,
    vertical: preset.vertical,
    basePath: `/store/${slug}`,
    profile: demoStoreProfile(preset.vertical, preset.demo.storeName, preset.demo.tagline),
  };
  return { document: preset.build(), data, store };
}

export async function tenantPreview(tenant: Tenant) {
  const data = await getCatalogApi({ storeKey: tenant.apiKey, vertical: tenant.vertical }).home();
  const store: ThumbnailStore = {
    slug: tenant.slug,
    storeKey: tenant.apiKey,
    vertical: tenant.vertical,
    basePath: `/store/${tenant.slug}`,
    profile: tenant.profile,
  };
  return { data, store };
}
