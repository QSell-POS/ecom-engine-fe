import type { Metadata } from "next";
import { OrdersGrid } from "@/components/order/OrdersGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { getOrders } from "@/lib/api/order/service";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const { data: orders } = await getOrders({ limit: 200 });

  return (
    <>
      <PageHeader title="Orders" description="Everything your customers have bought, and where each order stands." />
      <OrdersGrid orders={orders} />
    </>
  );
}
