"use client";

import { useTransition } from "react";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

/**
 * Starts Meta OAuth. The API builds the URL (it holds the app id and scopes)
 * and Meta redirects back to /admin/chat/callback, which bounces the merchant
 * to FRONTEND_URL — so that env var must point at this dashboard.
 */
export function ConnectMetaButton({ connectUrl, error }: { connectUrl?: string; error?: string }) {
  const [isPending, startTransition] = useTransition();

  function connect() {
    if (!connectUrl) {
      toast.error(error ?? "Chat is not configured on the API yet.");
      return;
    }
    startTransition(() => {
      window.location.href = connectUrl;
    });
  }

  return (
    <Button variant="outline" onClick={connect} disabled={isPending}>
      {isPending ? <Spinner /> : <Link2 />}
      Connect Meta page
    </Button>
  );
}
