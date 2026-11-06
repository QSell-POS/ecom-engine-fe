import type { Metadata } from "next";
import { CreateBrandButton } from "@/components/brand/BrandFormDialog";
import { BrandsGrid } from "@/components/brand/BrandsGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { getBrandsAdmin } from "@/lib/api/brand";
import { loadAllPages } from "@/lib/api/shared/types";
import { denyUnless } from "@/lib/api/rbac/access";
import { Can } from "@/components/auth/PermissionsProvider";

export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage() {
  const denied = await denyUnless("brands:view");
  if (denied) return denied;

  const brands = await loadAllPages(getBrandsAdmin);

  return (
    <>
      <PageHeader
        title="Brands"
        description="The manufacturers and labels behind your products."
        actions={<Can I="brands:manage"><CreateBrandButton /></Can>}
      />
      <BrandsGrid brands={brands} />
    </>
  );
}
