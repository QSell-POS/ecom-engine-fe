import type { Metadata } from "next";
import { AddressesView } from "@/components/storefront/pages/AccountViews";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default function Page() {
  return <AddressesView />;
}
