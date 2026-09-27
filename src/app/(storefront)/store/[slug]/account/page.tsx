import type { Metadata } from "next";
import { AccountOverview } from "@/components/storefront/pages/AccountViews";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default function Page() {
  return <AccountOverview />;
}
