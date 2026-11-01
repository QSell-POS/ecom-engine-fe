export const TENANT_COOKIE = "ee_tenant";
/**
 * Set while a merchant previews one of their unpublished themes.
 *
 * The public storefront no longer reads it: `/storefront/theme` serves the
 * published document only, so a draft is previewed in the builder's canvas
 * rather than on the live store. Kept because the preview routes still clear
 * it for anyone holding one from before.
 */
export const PREVIEW_COOKIE = "ee_preview_theme";

export const THEME_ROUTES = {
  list: "/themes",
  store: "/themes/store",
  storeTheme: (presetId: string) => `/themes/store/${presetId}`,
  customize: "/themes/customize",
  editor: (themeId: string) => `/editor/${themeId}`,
  /** Opens the merchant's store showing this theme's draft. */
  preview: (themeId: string) => `/preview/${themeId}`,
  exitPreview: "/preview/exit",
  /** Full demo store for a theme-store preset. */
  demo: (presetId: string) => `/store/demo-${presetId}`,
  /**
   * The merchant's live store. A store only resolves on its own subdomain, so
   * on a deployment with an admin domain this is `https://<slug>.<root>`;
   * local development (no admin domain) keeps the in-app path.
   */
  storefront: (tenantSlug: string) => {
    const root =
      process.env.NEXT_PUBLIC_ROOT_DOMAIN ??
      (process.env.NEXT_PUBLIC_ADMIN_DOMAIN ?? "").split(".").slice(1).join(".");
    return root ? `https://${tenantSlug}.${root}` : `/store/${tenantSlug}`;
  },
};
