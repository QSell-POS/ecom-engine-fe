import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OWNER_TOKEN_COOKIE } from "@/lib/api/session";

/**
 * Optimistic route protection: the dashboard is only reachable with an owner
 * token cookie, and the login screen redirects away when one is present. This
 * is a cheap check on the cookie's presence, not a validation of it — the API
 * is the authority, and `apiClient` surfaces its 401s.
 */
const PROTECTED = ["/dashboard", "/products", "/categories", "/brand", "/orders", "/customers", "/payments", "/reviews", "/discounts", "/delivery-rates", "/inventory", "/chat", "/api-keys", "/integrations", "/themes", "/editor", "/settings"];

const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
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
  // Skip static assets, the storefront, and API/webhook route handlers.
  matcher: ["/((?!_next/static|_next/image|api/|store/|preview/|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
