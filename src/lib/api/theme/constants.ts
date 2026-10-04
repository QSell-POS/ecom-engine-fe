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
  storefront: (tenantSlug: string) => `/store/${tenantSlug}`,
};
