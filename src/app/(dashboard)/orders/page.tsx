import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { OrdersGrid } from "@/components/order/OrdersGrid";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { getCustomer } from "@/lib/api/customer/service";
import { customerName } from "@/lib/api/customer/types";
import { ORDER_ROUTES } from "@/lib/api/order/constants";
import { getOrders } from "@/lib/api/order/service";
import { loadAllPages } from "@/lib/api/shared/types";
import { denyUnless } from "@/lib/api/rbac/access";

export const metadata: Metadata = { title: "Orders" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ customerId?: string }> }) {
  const denied = await denyUnless("orders:view");
  if (denied) return denied;

  const { customerId: raw } = await searchParams;
  // Filtered by the API, not the grid: "View orders" on a customer lands here.
  const customerId = raw && UUID.test(raw) ? raw : undefined;

  const [orders, customer] = await Promise.all([
    loadAllPages((params) => getOrders({ ...params, customerId })),
    customerId ? getCustomer(customerId).catch(() => null) : null,
  ]);

  return (
    <>
      <PageHeader
        title={customer ? `Orders from ${customerName(customer)}` : "Orders"}
        description={
          customerId
            ? "Only this customer's orders are shown."
            : "Everything your customers have bought, and where each order stands."
        }
        actions={
          customerId ? (
            <Button variant="outline" asChild>
              <Link href={ORDER_ROUTES.list}>
                <X /> Show all orders
              </Link>
            </Button>
          ) : undefined
        }
      />
      <OrdersGrid key={customerId ?? "all"} orders={orders} />
    </>
  );
}
