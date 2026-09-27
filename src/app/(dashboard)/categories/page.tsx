import type { Metadata } from "next";
import { CategoriesGrid } from "@/components/category/CategoriesGrid";
import { CreateCategoryButton } from "@/components/category/CategoryFormDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { getCategoriesAdmin } from "@/lib/api/category/service";
import type { Category } from "@/lib/api/category/types";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const { data } = await getCategoriesAdmin({ limit: 1000 });

  return (
    <>
      <PageHeader
        title="Categories"
        description="How products are grouped in your store's navigation."
        actions={<CreateCategoryButton />}
      />
      <CategoriesGrid categories={data as Category[]} />
    </>
  );
}
