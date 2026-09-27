import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderConfirmation } from "@/components/storefront/pages/CheckoutView";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <OrderConfirmation />
    </Suspense>
  );
}
