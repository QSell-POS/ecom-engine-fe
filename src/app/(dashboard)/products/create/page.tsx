import Link from "next/link";
import { CreateProductForm } from "@/components/product/CreateProductForm";
import { getBrandsAdmin } from "@/lib/api/brand";
import { getCategoriesAdmin } from "@/lib/api/category/service";

export default async function CreateProductPage() {
  const [{ data: brands }, { data: categories }] = await Promise.all([
    getBrandsAdmin(),
    getCategoriesAdmin(),
  ]);

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
        <h1 className="text-2xl font-semibold text-slate-900">
          Create product
        </h1>
      </div>
      <CreateProductForm brands={brands} categories={categories} />
    </div>
  );
}
