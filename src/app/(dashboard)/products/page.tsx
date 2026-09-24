import { ProductDataTable } from "@/components/product/ProductDataTable";
import { getProductsAdmin } from "@/lib/api/product";
import { Product } from "@/types";

export default async function ProductsPage() {
  const res = await getProductsAdmin();
  const products: Product[] = res?.data || [];

  return (
    <div className="space-y-6 p-6">
      <ProductDataTable products={products} />
    </div>
  );
}
