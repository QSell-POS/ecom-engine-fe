import { NextResponse } from "next/server";
import { THEME_ROUTES } from "@/lib/api/theme";

// Legacy link: theme-store previews are now full demo stores.
export async function GET(request: Request, { params }: { params: Promise<{ presetId: string }> }) {
  const { presetId } = await params;
  return NextResponse.redirect(new URL(THEME_ROUTES.demo(presetId), request.url));
}
