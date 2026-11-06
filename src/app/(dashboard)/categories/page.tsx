import type { Metadata } from "next";
import { CategoriesGrid } from "@/components/category/CategoriesGrid";
import { CreateCategoryButton } from "@/components/category/CategoryFormDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { getCategoriesAdmin } from "@/lib/api/category/service";
import type { Category } from "@/lib/api/category/types";
import { loadAllPages } from "@/lib/api/shared/types";
import { denyUnless } from "@/lib/api/rbac/access";
import { Can } from "@/components/auth/PermissionsProvider";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const denied = await denyUnless("categories:view");
  if (denied) return denied;

  const data = await loadAllPages(getCategoriesAdmin);

  return (
    <>
      <PageHeader
        title="Categories"
        description="How products are grouped in your store's navigation."
        actions={<Can I="categories:manage"><CreateCategoryButton categories={data as Category[]} /></Can>}
      />
      <CategoriesGrid categories={data as Category[]} />
    </>
  );
}
