import type { Metadata } from "next";
import { CheckoutView } from "@/components/storefront/pages/CheckoutView";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function Page() {
  return <CheckoutView />;
}
