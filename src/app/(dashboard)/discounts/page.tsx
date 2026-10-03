import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateDiscountButton } from "@/components/discount/DiscountFormDialog";
import { DiscountsGrid } from "@/components/discount/DiscountsGrid";
import { getDiscounts } from "@/lib/api/discount/service";
import { loadAllPages } from "@/lib/api/shared/types";

export const metadata: Metadata = { title: "Discounts" };

export default async function DiscountsPage() {
  const discounts = await loadAllPages(getDiscounts);

  return (
    <>
      <PageHeader title="Discounts" description="Codes customers enter at checkout." actions={<CreateDiscountButton />} />
      <DiscountsGrid discounts={discounts} />
    </>
  );
}
