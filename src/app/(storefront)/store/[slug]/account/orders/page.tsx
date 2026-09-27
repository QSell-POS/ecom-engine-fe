import type { Metadata } from "next";
import { OrdersView } from "@/components/storefront/pages/AccountViews";

export const metadata: Metadata = { title: "Orders", robots: { index: false } };

export default function Page() {
  return <OrdersView />;
}
