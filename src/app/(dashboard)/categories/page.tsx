import { CreateCategoryForm } from "@/components/category/CreateCategoryForm";
import { CategoryDataTable } from "@/components/category/CategoryDataTable";
import { getCategoriesAdmin } from "@/lib/api/category/service";
import { Category } from "@/types";

export default async function CategoriesPage() {
  const { data: categories } = await getCategoriesAdmin();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Categories
        </h1>
        <CreateCategoryForm />
      </div>
      <CategoryDataTable categories={categories as Category[]} />
    </div>
  );
}
