import "server-only";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/api/client";
import { newId, sanitizeDocument } from "@/lib/theme-engine/document";
import { StoreProfileSchema } from "@/lib/storefront/profile";
import type { StoreProfile } from "@/lib/storefront/types";
import { sanitizeSettings } from "@/lib/theme-engine/document";
import { getPreset } from "@/lib/theme-engine/presets";
import { BRAND_SETTING_KEYS, THEME_SETTINGS_SCHEMA } from "@/lib/theme-engine/schema";
import { mutateDb, readDb } from "./db";
import { TENANT_COOKIE } from "./constants";
import { demoStoreProfile } from "@/lib/storefront/mock/catalog-data";
import { DEMO_STORE_PREFIX } from "@/lib/theme-engine/presets";
import type { ResolvedStorefront, Tenant, Theme, ThemeSummary } from "./types";

// ---------------------------------------------------------------------------
// Theme service. Currently backed by the mock JSON db (./db.ts); every
// function maps 1:1 onto an endpoint of the backend contract documented in
// docs/theme-engine.md, so it can be swapped to `apiClient` calls without
// touching pages, actions or components. All mutating functions take the
// tenant id and verify ownership: a tenant can never read or modify another
// tenant's themes.
// ---------------------------------------------------------------------------

function notFound(what: string): never {
  throw new ApiError(404, `${what} not found`);
}

export async function listTenants(): Promise<Tenant[]> {
  return (await readDb()).tenants;
}

/** The tenant the admin is currently managing (mock auth: a cookie). */
export async function getCurrentTenant(): Promise<Tenant> {
  const tenantId = (await cookies()).get(TENANT_COOKIE)?.value;
  const { tenants } = await readDb();
  return tenants.find((t) => t.id === tenantId) ?? tenants[0];
}

function toSummary(theme: Theme, tenant: Tenant): ThemeSummary {
  const { published, ...rest } = theme;
  return {
    ...rest,
    isLive: tenant.liveThemeId === theme.id,
    hasUnpublishedChanges: JSON.stringify(theme.draft) !== JSON.stringify(published),
  };
}

export async function listThemes(tenantId: string): Promise<ThemeSummary[]> {
  const db = await readDb();
  const tenant = db.tenants.find((t) => t.id === tenantId) ?? notFound("Tenant");
  return db.themes
    .filter((theme) => theme.tenantId === tenantId)
    .map((theme) => toSummary(theme, tenant))
    .sort((a, b) => Number(b.isLive) - Number(a.isLive) || b.updatedAt.localeCompare(a.updatedAt));
}

export async function getTheme(tenantId: string, themeId: string): Promise<Theme | null> {
  const { themes } = await readDb();
  return themes.find((t) => t.id === themeId && t.tenantId === tenantId) ?? null;
}

export async function createThemeFromPreset(
  tenantId: string,
  presetId: string,
  { publish }: { publish: boolean },
): Promise<Theme> {
  const preset = getPreset(presetId) ?? notFound("Theme preset");

  return mutateDb((db) => {
    const tenant = db.tenants.find((t) => t.id === tenantId) ?? notFound("Tenant");
    const owned = db.themes.filter((t) => t.tenantId === tenantId).length;
    if (owned >= tenant.themeLimit) {
      throw new ApiError(
        403,
        `Theme limit reached: the ${tenant.plan} plan allows ${tenant.themeLimit} themes. Delete a theme to add another.`,
      );
    }

    const now = new Date().toISOString();
    const draft = preset.build();
    const theme: Theme = {
      id: newId("thm"),
      tenantId,
      name: preset.name,
      presetId: preset.id,
      draft,
      published: publish ? structuredClone(draft) : null,
      createdAt: now,
      updatedAt: now,
      publishedAt: publish ? now : null,
    };
    db.themes.push(theme);
    if (publish) tenant.liveThemeId = theme.id;
    return theme;
  });
}

export async function duplicateTheme(tenantId: string, themeId: string): Promise<Theme> {
  return mutateDb((db) => {
    const tenant = db.tenants.find((t) => t.id === tenantId) ?? notFound("Tenant");
    const source = db.themes.find((t) => t.id === themeId && t.tenantId === tenantId) ?? notFound("Theme");
    if (db.themes.filter((t) => t.tenantId === tenantId).length >= tenant.themeLimit) {
      throw new ApiError(403, `Theme limit reached (${tenant.themeLimit}). Delete a theme to duplicate this one.`);
    }
    const now = new Date().toISOString();
    const copy: Theme = {
      ...structuredClone(source),
      id: newId("thm"),
      name: `Copy of ${source.name}`,
      published: null,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    };
    db.themes.push(copy);
    return copy;
  });
}

export async function deleteTheme(tenantId: string, themeId: string): Promise<void> {
  await mutateDb((db) => {
    const tenant = db.tenants.find((t) => t.id === tenantId) ?? notFound("Tenant");
    const index = db.themes.findIndex((t) => t.id === themeId && t.tenantId === tenantId);
    if (index === -1) notFound("Theme");
    if (tenant.liveThemeId === themeId) {
      throw new ApiError(409, "You can't delete your live theme. Publish another theme first.");
    }
    db.themes.splice(index, 1);
  });
}

export async function saveThemeDraft(
  tenantId: string,
  themeId: string,
  input: { document: unknown; name?: string },
): Promise<Theme> {
  const document = sanitizeDocument(input.document);
  return mutateDb((db) => {
    const theme = db.themes.find((t) => t.id === themeId && t.tenantId === tenantId) ?? notFound("Theme");
    theme.draft = document;
    if (input.name?.trim()) theme.name = input.name.trim().slice(0, 80);
    theme.updatedAt = new Date().toISOString();
    return theme;
  });
}

/** Snapshots the draft as the published version and makes this the live theme. */
export async function publishTheme(
  tenantId: string,
  themeId: string,
  input?: { document: unknown; name?: string },
): Promise<Theme> {
  const document = input ? sanitizeDocument(input.document) : null;
  return mutateDb((db) => {
    const tenant = db.tenants.find((t) => t.id === tenantId) ?? notFound("Tenant");
    const theme = db.themes.find((t) => t.id === themeId && t.tenantId === tenantId) ?? notFound("Theme");
    const now = new Date().toISOString();
    if (document) theme.draft = document;
    if (input?.name?.trim()) theme.name = input.name.trim().slice(0, 80);
    theme.published = structuredClone(theme.draft);
    theme.updatedAt = now;
    theme.publishedAt = now;
    tenant.liveThemeId = theme.id;
    return theme;
  });
}

/**
 * "Use this theme": installs a ready-made theme and makes it live in one
 * step, so the store is immediately ready. The previous live theme stays in
 * the library.
 */
export async function installTheme(tenantId: string, presetId: string): Promise<Theme> {
  return createThemeFromPreset(tenantId, presetId, { publish: true });
}

// ---- Store profile (simple customizer)

export async function getStoreProfile(tenantId: string): Promise<StoreProfile> {
  const { tenants } = await readDb();
  return (tenants.find((t) => t.id === tenantId) ?? notFound("Tenant")).profile;
}

export async function updateStoreProfile(tenantId: string, input: unknown): Promise<StoreProfile> {
  const parsed = StoreProfileSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(422, parsed.error.issues[0]?.message ?? "Check the highlighted fields.");
  const profile = parsed.data;
  return mutateDb((db) => {
    const tenant = db.tenants.find((t) => t.id === tenantId) ?? notFound("Tenant");
    tenant.profile = profile;
    tenant.name = profile.name;
    return profile;
  });
}

/**
 * Brand color and fonts from the simple customizer. Applied to both the
 * draft and the published version of the live theme, so the change is live
 * immediately without disturbing other unpublished builder edits.
 */
export async function updateBrandStyle(tenantId: string, themeId: string, patch: Record<string, unknown>): Promise<Theme> {
  return mutateDb((db) => {
    const theme = db.themes.find((t) => t.id === themeId && t.tenantId === tenantId) ?? notFound("Theme");
    const allowed = Object.fromEntries(BRAND_SETTING_KEYS.filter((key) => key in patch).map((key) => [key, patch[key]]));
    const fields = THEME_SETTINGS_SCHEMA.filter((field) => field.id in allowed);
    const clean = sanitizeSettings(fields, allowed);
    theme.draft.settings = { ...theme.draft.settings, ...clean };
    if (theme.published) theme.published.settings = { ...theme.published.settings, ...clean };
    theme.updatedAt = new Date().toISOString();
    return theme;
  });
}

// ---- Public storefront resolution (no admin session; by slug)

/**
 * What /store/:slug renders:
 *  - `demo-<presetId>`: a theme-store demo with demo content,
 *  - a merchant previewing one of their own themes (draft, via cookie),
 *  - otherwise the tenant's published live theme.
 */
export async function resolveStorefront(slug: string, previewThemeId?: string | null): Promise<ResolvedStorefront | null> {
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

  const db = await readDb();
  const tenant = db.tenants.find((t) => t.slug === slug);
  if (!tenant) return null;
  const base = { slug, storeKey: tenant.apiKey, vertical: tenant.vertical, profile: tenant.profile };

  const preview = previewThemeId ? db.themes.find((t) => t.id === previewThemeId && t.tenantId === tenant.id) : undefined;
  if (preview) {
    return { ...base, document: preview.draft, mode: "preview", theme: { id: preview.id, name: preview.name, presetId: preview.presetId } };
  }

  const live = db.themes.find((t) => t.id === tenant.liveThemeId && t.tenantId === tenant.id);
  if (!live?.published) return null;
  return { ...base, document: live.published, mode: "live", theme: { id: live.id, name: live.name, presetId: live.presetId } };
}

/** Headless: the live theme for a public API key (GET /api/storefront/theme). */
export async function getLiveThemeByApiKey(apiKey: string) {
  const db = await readDb();
  const tenant = db.tenants.find((t) => t.apiKey === apiKey);
  return tenant ? resolveStorefront(tenant.slug) : null;
}
