import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OWNER_TOKEN_COOKIE } from "@/lib/api/session";
import { STORE_HOST_HEADER } from "@/lib/api/store-host";
import { resolveStoreHost, type HostResolution } from "@/lib/api/storefront/resolve";

/**
 * Two jobs, decided by the request's host.
 *
 * **A storefront**, which is either of two deployments:
 *
 * - **Single-tenant** (`NEXT_PUBLIC_STORE_SLUG` set): this deployment serves
 *   exactly one tenant, at a fixed domain the merchant owns
 *   (`shop.theirdomain.com`), using a `storefront` API key. That key already
 *   scopes every request to the right tenant, so there is nothing to
 *   resolve — the shop host rewrites straight to `/store/:slug`.
 * - **Hosted multi-tenant** (`NEXT_PUBLIC_STORE_SLUG` unset): one deployment
 *   behind `*.qsellpos.com` serving every tenant, using a `platform` key.
 *   Here the host is the only way to know which tenant, so it is resolved
 *   with the API first — redirect if the store was renamed, 404 if unknown,
 *   otherwise rewrite with the resolved host attached so every API call
 *   downstream knows which store it is about.
 *
 * Nothing from the dashboard is reachable on a storefront host, in either
 * case — including its login page, which is for merchants, not shoppers.
 *
 * **The dashboard** (`ADMIN_DOMAIN`): the usual cookie check. Optimistic, not
 * a validation — the API is the authority and `apiClient` surfaces its 401s.
 */
const PROTECTED = [
  "/dashboard",
  "/products",
  "/categories",
  "/brand",
  "/orders",
  "/customers",
  "/payments",
  "/reviews",
  "/discounts",
  "/delivery-rates",
  "/inventory",
  "/media",
  "/chat",
  "/api-keys",
  "/integrations",
  "/themes",
  "/editor",
  "/settings",
];

const AUTH_PAGES = ["/login", "/register"];

const ADMIN_DOMAIN = process.env.NEXT_PUBLIC_ADMIN_DOMAIN ?? "";
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
/** Set only on a single-tenant deployment; see the module comment above. */
const STORE_SLUG = process.env.NEXT_PUBLIC_STORE_SLUG ?? "";

/**
 * One resolve per host rather than per request. Proxy instances are
 * short-lived and not shared, so this is a best-effort cache, not a store —
 * a miss costs one extra call, never a wrong answer.
 */
const RESOLVE_TTL_MS = 60_000;
const resolved = new Map<string, { at: number; value: HostResolution }>();

async function resolveHost(host: string): Promise<HostResolution> {
  const hit = resolved.get(host);
  if (hit && Date.now() - hit.at < RESOLVE_TTL_MS) return hit.value;

  const value = await resolveStoreHost(API_URL, host);
  // Don't cache a failure: the API may simply have been down for a moment.
  if (value.status !== "unknown") resolved.set(host, { at: Date.now(), value });
  return value;
}

function hostname(request: NextRequest): string {
  return (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = hostname(request);

  // Without an admin domain configured — local development — everything is
  // the dashboard and nothing is resolved.
  const isStorefront = Boolean(ADMIN_DOMAIN) && host !== ADMIN_DOMAIN.toLowerCase();

  if (isStorefront) {
    // Every storefront page lives under /store/:slug — "/products" on a shop
    // host and "/products" in the dashboard's own PROTECTED list are
    // different routes entirely once this prefix is added, so there is
    // nothing dashboard-shaped to guard against here: a shopper literally
    // cannot reach /dashboard, /login or /themes once every path is rewritten
    // under /store/:slug, and a path that happens to share a dashboard name
    // (/products, /categories) is this store's own page at that name.
    const suffix = pathname === "/" ? "" : pathname;

    // Single-tenant: the storefront key already means this one store, so
    // there is nothing to resolve and no x-store-host to attach.
    if (STORE_SLUG) {
      return NextResponse.rewrite(new URL(`/store/${STORE_SLUG}${suffix}`, request.url));
    }

    if (!API_URL) return NextResponse.next();

    const resolution = await resolveHost(host);

    if (resolution.status === "moved") {
      const target = new URL(request.nextUrl);
      target.host = resolution.host;
      // Permanent: the old address keeps redirecting, it is never reassigned.
      return NextResponse.redirect(target, 301);
    }

    if (resolution.status === "unknown") {
      return NextResponse.rewrite(new URL("/store-not-found", request.url));
    }

    // Links that already carry the internal prefix (old bookmarks, or the
    // admin's "/store/<slug>" links) would be prefixed twice and 404.
    const prefix = `/store/${resolution.store.subdomain}`;
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      const target = new URL(request.nextUrl);
      target.pathname = pathname.slice(prefix.length) || "/";
      return NextResponse.redirect(target, 308);
    }

    const headers = new Headers(request.headers);
    headers.set(STORE_HOST_HEADER, resolution.store.host);
    const url = new URL(`/store/${resolution.store.subdomain}${suffix}`, request.url);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  const signedIn = Boolean(request.cookies.get(OWNER_TOKEN_COOKIE)?.value);

  if (!signedIn && PROTECTED.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (signedIn && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api/|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
