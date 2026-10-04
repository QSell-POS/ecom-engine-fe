import type { Metadata } from "next";
import { CreateBrandButton } from "@/components/brand/BrandFormDialog";
import { BrandsGrid } from "@/components/brand/BrandsGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { getBrandsAdmin } from "@/lib/api/brand";
import { loadAllPages } from "@/lib/api/shared/types";

export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage() {
  const brands = await loadAllPages(getBrandsAdmin);

  return (
    <>
      <PageHeader
        title="Brands"
        description="The manufacturers and labels behind your products."
        actions={<CreateBrandButton />}
      />
      <BrandsGrid brands={brands} />
    </>
  );
}
