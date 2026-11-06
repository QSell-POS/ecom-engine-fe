import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateDiscountButton } from "@/components/discount/DiscountFormDialog";
import { DiscountsGrid } from "@/components/discount/DiscountsGrid";
import { getDiscounts } from "@/lib/api/discount/service";
import { loadAllPages } from "@/lib/api/shared/types";
import { denyUnless } from "@/lib/api/rbac/access";
import { Can } from "@/components/auth/PermissionsProvider";

export const metadata: Metadata = { title: "Discounts" };

export default async function DiscountsPage() {
  const denied = await denyUnless("discounts:view");
  if (denied) return denied;

  const discounts = await loadAllPages(getDiscounts);

  return (
    <>
      <PageHeader title="Discounts" description="Codes customers enter at checkout." actions={<Can I="discounts:manage"><CreateDiscountButton /></Can>} />
      <DiscountsGrid discounts={discounts} />
    </>
  );
}
