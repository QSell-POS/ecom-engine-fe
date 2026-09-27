import { NextResponse } from "next/server";
import { getCurrentTenant, getTheme, PREVIEW_COOKIE, THEME_ROUTES } from "@/lib/api/theme";

// GET /preview/:themeId opens the merchant's own store showing that theme's
// draft (every page, not just the home page). Only the signed-in admin of the
// store sees it; customers keep seeing the live theme.
export async function GET(request: Request, { params }: { params: Promise<{ themeId: string }> }) {
  const { themeId } = await params;
  const tenant = await getCurrentTenant();
  const theme = await getTheme(tenant.id, themeId);
  if (!theme) return NextResponse.redirect(new URL(THEME_ROUTES.list, request.url));

  const response = NextResponse.redirect(new URL(THEME_ROUTES.storefront(tenant.slug), request.url));
  response.cookies.set(PREVIEW_COOKIE, theme.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 4 });
  return response;
}
