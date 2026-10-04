import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Create your store" };

export default function RegisterPage() {
  return (
    <>
      <div className="space-y-1 text-center">
        <h2 className="text-lg font-semibold tracking-tight">Create your store</h2>
        <p className="text-sm text-muted-foreground">One account runs your catalog, orders and storefront.</p>
      </div>
      <RegisterForm />
    </>
  );
}
