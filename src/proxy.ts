import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OWNER_TOKEN_COOKIE } from "@/lib/api/session";
import { STORE_HOST_HEADER } from "@/lib/api/store-host";
import { resolveStoreHost, type HostResolution } from "@/lib/api/storefront/resolve";

/**
 * Two jobs, decided by the request's host.
 *
 * **A merchant's storefront** (`bibash-toys.qsellpos.com`): resolve the host
 * with the API, redirect if the store was renamed, 404 if it is unknown, and
 * otherwise rewrite to that store's pages with the resolved host attached so
 * every API call downstream knows which store it is about. Nothing from the
 * dashboard is reachable here — including its login page, which is for
 * merchants, not shoppers.
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
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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

function isAdminPath(pathname: string): boolean {
  return AUTH_PAGES.includes(pathname) || PROTECTED.some((route) => pathname === route || pathname.startsWith(`${route}/`));
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

    // Admin paths do not exist on a public shop.
    if (isAdminPath(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const headers = new Headers(request.headers);
    headers.set(STORE_HOST_HEADER, resolution.store.host);

    // The shop's root is the store, not a redirect to the dashboard.
    const url = pathname === "/" ? new URL(`/store/${resolution.store.subdomain}`, request.url) : request.nextUrl;
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
