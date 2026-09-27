import type { Metadata } from "next";
import { ForgotPasswordView } from "@/components/storefront/pages/AuthViews";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function Page() {
  return <ForgotPasswordView />;
}
