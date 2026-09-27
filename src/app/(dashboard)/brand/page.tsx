import type { Metadata } from "next";
import { CreateBrandButton } from "@/components/brand/BrandFormDialog";
import { BrandsGrid } from "@/components/brand/BrandsGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { getBrandsAdmin } from "@/lib/api/brand";

export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage() {
  const { data: brands } = await getBrandsAdmin({ limit: 1000 });

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
