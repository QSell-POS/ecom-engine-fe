import { CreateBrandForm } from "@/components/brand/CreateBrandForm";
import { BrandDataTable } from "@/components/brand/BrandDataTable";
import { getBrandsAdmin } from "@/lib/api/brand";
import { Brand } from "@/types";

export default async function BrandsPage() {
  const res = await getBrandsAdmin();
  const brands: Brand[] = res.data;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Brands</h1>

        <CreateBrandForm />
      </div>

      <BrandDataTable brands={brands} />
    </div>
  );
}
