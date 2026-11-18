import type { Metadata } from "next";
import { ReturnsGrid } from "@/components/returns/ReturnsGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { getReturns } from "@/lib/api/returns/service";
import { loadAllPages } from "@/lib/api/shared/types";
import { denyUnless } from "@/lib/api/rbac/access";

export const metadata: Metadata = { title: "Returns" };

export default async function ReturnsPage() {
  const denied = await denyUnless("orders:view");
  if (denied) return denied;

  const returns = await loadAllPages((params) => getReturns(params));

  return (
    <>
      <PageHeader title="Returns" description="Return, refund and exchange requests, and every return your store has processed." />
      <ReturnsGrid returns={returns} />
    </>
  );
}
