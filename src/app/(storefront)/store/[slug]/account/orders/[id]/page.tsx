import type { Metadata } from "next";
import { OrderDetailView } from "@/components/storefront/pages/AccountViews";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}
