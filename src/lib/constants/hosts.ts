/**
 * One deployment serves two sites: the dashboard and the public shop. Which
 * one a request gets is decided by its Host header, not its path.
 *
 * These are read in `proxy.ts`, which runs before rendering, so they have to
 * be NEXT_PUBLIC_ — inlined at build time rather than read from the
 * environment at runtime. Changing them needs a rebuild.
 */
export const ADMIN_DOMAIN = process.env.NEXT_PUBLIC_ADMIN_DOMAIN ?? "";

/** The store the shop domain serves at its root. */
export const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG ?? "";

/**
 * True when this request is for the public shop.
 *
 * Any host that is not the admin domain counts as the shop, so a bare IP, a
 * preview URL or a second shop domain all behave publicly. With no admin
 * domain configured — local development — nothing is treated as the shop and
 * the dashboard stays reachable at `/`.
 */
export function isShopHost(host: string | null | undefined): boolean {
  if (!ADMIN_DOMAIN || !host) return false;
  const name = host.split(":")[0].toLowerCase();
  return name !== ADMIN_DOMAIN.toLowerCase();
}

export function storefrontPath(slug = STORE_SLUG): string {
  return slug ? `/store/${slug}` : "/store";
}
