import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { PaymentsGrid } from "@/components/payment/PaymentsGrid";
import { getPayments } from "@/lib/api/payment/service";
import { loadAllPages } from "@/lib/api/shared/types";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const payments = await loadAllPages(getPayments);

  return (
    <>
      <PageHeader title="Payments" description="Every payment attempt against your orders, for reconciliation." />
      <PaymentsGrid payments={payments} />
    </>
  );
}
