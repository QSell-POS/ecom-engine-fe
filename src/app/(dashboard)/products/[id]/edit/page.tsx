import Link from "next/link";
import { notFound } from "next/navigation";
import { CreateProductForm } from "@/components/product/CreateProductForm";
import { getBrandsAdmin } from "@/lib/api/brand";
import { getCategoriesAdmin } from "@/lib/api/category/service";
import { getProductAdmin } from "@/lib/api/product";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, { data: brands }, { data: categories }] = await Promise.all([
    getProductAdmin(id),
    getBrandsAdmin(),
    getCategoriesAdmin(),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/products"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Products
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-2xl font-semibold text-slate-900">Edit product</h1>
      </div>
      <CreateProductForm
        product={product}
        brands={brands}
        categories={categories}
      />
    </div>
  );
}
