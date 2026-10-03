import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PageSelection } from "@/components/chat/PageSelection";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getPendingPageSelection } from "@/lib/api/chat/service";

export const metadata: Metadata = { title: "Integrations" };

/**
 * Where the API sends the owner back after Meta OAuth (FRONTEND_URL
 * /integrations), with one of ?success=true, ?selectionId=… or ?error=….
 */
const ERRORS: Record<string, string> = {
  denied: "You cancelled the connection on Meta's side. Nothing changed.",
  already_connected: "That page is already connected to a store.",
  failed: "Meta rejected the connection. Try again, and check the page's permissions.",
};

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; selectionId?: string; error?: string }>;
}) {
  const { success, selectionId, error } = await searchParams;

  const selection = selectionId
    ? await getPendingPageSelection(selectionId).catch((cause) => {
        if (cause instanceof ApiError) return null;
        throw cause;
      })
    : null;

  return (
    <>
      <PageHeader title="Integrations" description="Facebook and Instagram messaging for your store." />

      {error && (
        <p className="mb-8 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          {ERRORS[error] ?? "That connection did not complete."}
        </p>
      )}

      {success === "true" && (
        <p className="mb-8 flex items-start gap-2 rounded-md border border-success/40 bg-success/5 px-4 py-3 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
          Connected. New messages now arrive in Chat.
        </p>
      )}

      {selectionId &&
        (selection?.pages?.length ? (
          <>
            <p className="mb-4 max-w-prose text-sm text-muted-foreground">
              You manage more than one page. Pick the one that should receive your store&apos;s messages.
            </p>
            <PageSelection selectionId={selectionId} pages={selection.pages} />
          </>
        ) : (
          <p className="max-w-prose text-sm text-muted-foreground">
            That page selection has expired. Start the connection again from Chat.
          </p>
        ))}

      {!error && !selectionId && success !== "true" && (
        <p className="max-w-prose text-sm text-muted-foreground">Nothing to confirm here. Connect a Meta page from Chat.</p>
      )}

      <div className="mt-8">
        <Button variant="outline" asChild>
          <Link href="/chat">Go to Chat</Link>
        </Button>
      </div>
    </>
  );
}
