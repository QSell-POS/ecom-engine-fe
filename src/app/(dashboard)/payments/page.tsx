import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { PaymentsGrid } from "@/components/payment/PaymentsGrid";
import { getPayments } from "@/lib/api/payment/service";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const { data: payments } = await getPayments({ limit: 200 });

  return (
    <>
      <PageHeader title="Payments" description="Every payment attempt against your orders, for reconciliation." />
      <PaymentsGrid payments={payments} />
    </>
  );
}
