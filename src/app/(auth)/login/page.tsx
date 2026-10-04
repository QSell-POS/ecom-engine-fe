import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold tracking-tight">Sign in to your store</h2>
        <p className="text-sm text-muted-foreground">Manage products, orders and your storefront.</p>
      </div>
      {/* LoginForm reads ?next= from the URL. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
