import { ApiError } from "@/lib/api/client";
import { getProductAdmin } from "@/lib/api/product";

// One product, for the workspace when the record isn't on the loaded page
// (shared links, records from another page).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const product = await getProductAdmin(id);
    if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
    return Response.json(product);
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Couldn't load the product";
    return Response.json({ error: message }, { status });
  }
}
