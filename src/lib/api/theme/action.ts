"use server";
import { cookies } from "next/headers";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import type { ThemeDocument } from "@/lib/theme-engine/types";
import { authActionClient } from "@/lib/safe-action";
import { storefrontThemeTag } from "@/lib/api/storefront/theme";
import { TENANT_COOKIE, THEME_ROUTES } from "./constants";
import {
  createThemeFromPreset,
  deleteTheme,
  duplicateTheme,
  getCurrentTenant,
  installTheme,
  updateBrandStyle,
  updateStoreProfile,
  listTenants,
  publishTheme,
  saveThemeDraft,
} from "./service";

const ThemeIdSchema = z.object({ themeId: z.string().min(1).max(64) });

const SaveSchema = ThemeIdSchema.extend({
  document: z.unknown(),
  name: z.string().max(80).optional(),
});

/**
 * `host` is the store's own address. Publishing, a brand patch or a profile
 * save all change what `/storefront/theme` answers, and that response is
 * cached per host — without dropping its tag the merchant keeps seeing the
 * old shop until the cache expires.
 */
function revalidateTenant(slug: string, themeId?: string, host?: string) {
  revalidatePath(THEME_ROUTES.list);
  revalidatePath(THEME_ROUTES.customize);
  revalidatePath(THEME_ROUTES.storefront(slug), "layout");
  if (host) updateTag(storefrontThemeTag(host));
  if (themeId) {
    revalidatePath(THEME_ROUTES.editor(themeId));
  }
}

export const switchTenantAction = authActionClient
  .inputSchema(z.object({ tenantId: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    const tenants = await listTenants();
    if (!tenants.some((t) => t.id === parsedInput.tenantId)) throw new Error("Unknown tenant");
    (await cookies()).set(TENANT_COOKIE, parsedInput.tenantId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    revalidatePath(THEME_ROUTES.list);
    return { ok: true };
  });

export const createThemeFromPresetAction = authActionClient
  .inputSchema(z.object({ presetId: z.string().min(1), publish: z.boolean() }))
  .action(async ({ parsedInput }) => {
    const tenant = await getCurrentTenant();
    const theme = await createThemeFromPreset(tenant.id, parsedInput.presetId, parsedInput.publish);
    revalidateTenant(tenant.slug, undefined, tenant.apiKey);
    return { themeId: theme.id };
  });

export const duplicateThemeAction = authActionClient
  .inputSchema(ThemeIdSchema)
  .action(async ({ parsedInput }) => {
    const tenant = await getCurrentTenant();
    const theme = await duplicateTheme(tenant.id, parsedInput.themeId);
    revalidateTenant(tenant.slug, undefined, tenant.apiKey);
    return { themeId: theme.id };
  });

export const deleteThemeAction = authActionClient
  .inputSchema(ThemeIdSchema)
  .action(async ({ parsedInput }) => {
    const tenant = await getCurrentTenant();
    await deleteTheme(tenant.id, parsedInput.themeId);
    revalidateTenant(tenant.slug, undefined, tenant.apiKey);
    return { ok: true };
  });

export const saveThemeDraftAction = authActionClient
  .inputSchema(SaveSchema)
  .action(async ({ parsedInput }) => {
    const tenant = await getCurrentTenant();
    const { themeId, document, ...rest } = parsedInput;
    // The API takes the document plus its optional name and expectedRevision.
    const theme = await saveThemeDraft(tenant.id, themeId, document as ThemeDocument, rest);
    revalidateTenant(tenant.slug, theme.id, tenant.apiKey);
    return { document: theme.draft, updatedAt: theme.updatedAt };
  });

/** Publishes the theme (optionally saving the given document first) and makes it live. */
export const publishThemeAction = authActionClient
  .inputSchema(ThemeIdSchema.extend({ document: z.unknown().optional(), name: z.string().max(80).optional() }))
  .action(async ({ parsedInput }) => {
    const tenant = await getCurrentTenant();
    const { themeId, document, name } = parsedInput;
    const theme = await publishTheme(tenant.id, themeId, document === undefined ? {} : { document: document as ThemeDocument, name });
    revalidateTenant(tenant.slug, theme.id, tenant.apiKey);
    return { document: theme.draft, publishedAt: theme.publishedAt };
  });

/** Theme store "Use this theme": installs and publishes in one step. */
export const installThemeAction = authActionClient
  .inputSchema(z.object({ presetId: z.string().min(1).max(64) }))
  .action(async ({ parsedInput }) => {
    const tenant = await getCurrentTenant();
    const theme = await installTheme(tenant.id, parsedInput.presetId);
    revalidateTenant(tenant.slug, theme.id, tenant.apiKey);
    return { themeId: theme.id };
  });

/** Simple customizer: store profile plus brand color/fonts on the live theme. */
export const saveStoreDesignAction = authActionClient
  .inputSchema(
    z.object({
      profile: z.unknown(),
      themeId: z.string().min(1).max(64).nullable(),
      brand: z.record(z.string(), z.unknown()),
    }),
  )
  .action(async ({ parsedInput }) => {
    const tenant = await getCurrentTenant();
    const profile = await updateStoreProfile(tenant.id, parsedInput.profile);
    if (parsedInput.themeId) await updateBrandStyle(tenant.id, parsedInput.themeId, parsedInput.brand);
    revalidateTenant(tenant.slug, parsedInput.themeId ?? undefined);
    return { profile };
  });
