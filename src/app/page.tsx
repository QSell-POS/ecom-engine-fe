import type { Metadata } from "next";
import { LandingPage } from "./_landing";

export const metadata: Metadata = {
  title: "EcomEngine — Run your store, your way",
  description: "Full e-commerce admin dashboard and storefront builder. Products, orders, chat, reviews, themes — all in one place.",
};

export default function RootPage() {
  return <LandingPage />;
}
