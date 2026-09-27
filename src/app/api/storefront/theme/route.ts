import { getLiveThemeByApiKey } from "@/lib/api/theme";

// Headless storefront API: a storefront client (Next.js, mobile app, etc.)
// sends the tenant's public API key and receives the store profile and the
// published theme JSON.
//   curl -H "x-api-key: pk_test_acme_7f3a9c21" http://localhost:3000/api/storefront/theme
export async function GET(request: Request) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return Response.json({ error: "Missing x-api-key header" }, { status: 401 });
  }

  const store = await getLiveThemeByApiKey(apiKey);
  if (!store) {
    return Response.json({ error: "Invalid API key or no published theme" }, { status: 404 });
  }

  return Response.json({ store: { slug: store.slug, ...store.profile }, theme: store.document });
}
