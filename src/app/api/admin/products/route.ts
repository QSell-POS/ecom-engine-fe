import { ApiError } from "@/lib/api/client";
import { productColumns } from "@/lib/api/product/grid";
import { queryProducts } from "@/lib/api/product/grid-server";
import { parseQuery } from "@/lib/data-grid";

// Server-side grid endpoint. Speaks the grid's URL format, so the web grid,
// shared links and a native app all use the same contract:
//   GET /api/admin/products?q=shirt&sort=price.desc&page=2&size=25&f.status=active
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    return Response.json(await queryProducts(parseQuery(params, productColumns)));
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Couldn't load products";
    return Response.json({ error: message }, { status });
  }
}
