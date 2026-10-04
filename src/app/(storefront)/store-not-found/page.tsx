import type { Metadata } from "next";
import { Store } from "lucide-react";

export const metadata: Metadata = {
  title: "Store not found",
  robots: { index: false, follow: false },
};

/**
 * Where `proxy.ts` sends a request whose host resolves to nothing: an unknown
 * or malformed address, or a suspended store. Deliberately says little — which
 * store addresses exist is not something to help a visitor enumerate.
 */
export default function StoreNotFoundPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="max-w-md space-y-4 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-xl border bg-muted/40">
          <Store className="size-6 text-muted-foreground" />
        </span>
        <h1 className="text-xl font-semibold tracking-tight">This store is not available</h1>
        <p className="text-sm text-muted-foreground">
          The address you followed does not belong to a store, or the store has been closed. Check the link and try again.
        </p>
      </div>
    </main>
  );
}
