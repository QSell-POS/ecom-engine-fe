"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/lib/safe-action";
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

function revalidateTenant(slug: string, themeId?: string) {
  revalidatePath(THEME_ROUTES.list);
  revalidatePath(THEME_ROUTES.customize);
  revalidatePath(THEME_ROUTES.storefront(slug), "layout");
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
    const theme = await createThemeFromPreset(tenant.id, parsedInput.presetId, {
      publish: parsedInput.publish,
    });
    revalidateTenant(tenant.slug);
    return { themeId: theme.id };
  });

export const duplicateThemeAction = authActionClient
  .inputSchema(ThemeIdSchema)
  .action(async ({ parsedInput }) => {
    const tenant = await getCurrentTenant();
    const theme = await duplicateTheme(tenant.id, parsedInput.themeId);
    revalidateTenant(tenant.slug);
    return { themeId: theme.id };
  });

export const deleteThemeAction = authActionClient
  .inputSchema(ThemeIdSchema)
  .action(async ({ parsedInput }) => {
    const tenant = await getCurrentTenant();
    await deleteTheme(tenant.id, parsedInput.themeId);
    revalidateTenant(tenant.slug);
    return { ok: true };
  });

export const saveThemeDraftAction = authActionClient
  .inputSchema(SaveSchema)
  .action(async ({ parsedInput }) => {
    const tenant = await getCurrentTenant();
    const theme = await saveThemeDraft(tenant.id, parsedInput.themeId, parsedInput);
    revalidateTenant(tenant.slug, theme.id);
    return { document: theme.draft, updatedAt: theme.updatedAt };
  });

/** Publishes the theme (optionally saving the given document first) and makes it live. */
export const publishThemeAction = authActionClient
  .inputSchema(ThemeIdSchema.extend({ document: z.unknown().optional(), name: z.string().max(80).optional() }))
  .action(async ({ parsedInput }) => {
    const tenant = await getCurrentTenant();
    const { themeId, document, name } = parsedInput;
    const theme = await publishTheme(
      tenant.id,
      themeId,
      document === undefined ? undefined : { document, name },
    );
    revalidateTenant(tenant.slug, theme.id);
    return { document: theme.draft, publishedAt: theme.publishedAt };
  });

/** Theme store "Use this theme": installs and publishes in one step. */
export const installThemeAction = authActionClient
  .inputSchema(z.object({ presetId: z.string().min(1).max(64) }))
  .action(async ({ parsedInput }) => {
    const tenant = await getCurrentTenant();
    const theme = await installTheme(tenant.id, parsedInput.presetId);
    revalidateTenant(tenant.slug, theme.id);
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
