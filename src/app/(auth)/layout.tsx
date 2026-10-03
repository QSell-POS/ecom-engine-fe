import type { ReactNode } from "react";
import { Store } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <span className="inline-flex size-10 items-center justify-center rounded-lg border bg-muted/40">
            <Store className="size-5" />
          </span>
          <h1 className="text-xl font-semibold tracking-tight">ecom engine</h1>
        </div>
        {children}
      </div>
    </main>
  );
}
