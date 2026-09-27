import { NextResponse } from "next/server";
import { PREVIEW_COOKIE, THEME_ROUTES } from "@/lib/api/theme";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL(THEME_ROUTES.list, request.url));
  response.cookies.delete(PREVIEW_COOKIE);
  return response;
}
