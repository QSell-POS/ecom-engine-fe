import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OWNER_TOKEN_COOKIE } from "@/lib/api/session";
import { STORE_SLUG, isShopHost, storefrontPath } from "@/lib/constants/hosts";

/**
 * Two jobs, in this order:
 *
 * 1. **Keep the two sites apart.** The shop domain is a public storefront that
 *    talks to the API with the storefront key alone — it must never show a
 *    tenant login or a dashboard screen, so admin paths there are sent back to
 *    the shop, and its root serves the store rather than redirecting to
 *    `/dashboard`.
 * 2. **Guard the dashboard.** On the admin domain, the dashboard needs an
 *    owner token cookie. This is an optimistic check on the cookie's presence,
 *    not a validation of it — the API is the authority, and `apiClient`
 *    surfaces its 401s.
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

function isAdminPath(pathname: string): boolean {
  return (
    AUTH_PAGES.includes(pathname) ||
    PROTECTED.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isShopHost(request.headers.get("host"))) {
    // The shop's root is the store, not a redirect to the dashboard.
    if (pathname === "/" && STORE_SLUG) {
      return NextResponse.rewrite(new URL(storefrontPath(), request.url));
    }
    // Nothing from the dashboard belongs on a public domain — including its
    // login page, which is for merchants, not shoppers.
    if (isAdminPath(pathname)) {
      return NextResponse.redirect(new URL(STORE_SLUG ? storefrontPath() : "/", request.url));
    }
    return NextResponse.next();
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
  // Skip static assets and the API/webhook route handlers; everything else is
  // host-routed above.
  matcher: ["/((?!_next/static|_next/image|api/|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
