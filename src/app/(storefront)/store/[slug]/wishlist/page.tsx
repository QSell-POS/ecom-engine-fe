import type { Metadata } from "next";
import { WishlistView } from "@/components/storefront/pages/CartView";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default function Page() {
  return <WishlistView />;
}
