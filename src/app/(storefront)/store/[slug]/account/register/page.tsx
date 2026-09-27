import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterView } from "@/components/storefront/pages/AuthViews";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <RegisterView />
    </Suspense>
  );
}
