import type { Metadata } from "next";
import { CartView } from "@/components/storefront/pages/CartView";

export const metadata: Metadata = { title: "Your bag", robots: { index: false } };

export default function Page() {
  return <CartView />;
}
