"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { selectChatPageAction } from "@/lib/api/chat/action";
import type { ChatPage } from "@/lib/api/chat/types";
import { cn } from "@/lib/utils";

/**
 * When Meta OAuth returns several pages, the owner picks the one to connect.
 * Selections expire, so a failure here means re-running the OAuth flow.
 */
export function PageSelection({ selectionId, pages }: { selectionId: string; pages: ChatPage[] }) {
  const router = useRouter();
  const [chosen, setChosen] = useState<string | null>(pages[0]?.id ?? null);
  const [isPending, startTransition] = useTransition();

  function connect() {
    if (!chosen) return;
    startTransition(async () => {
      const result = await selectChatPageAction({ selectionId, pageId: chosen });
      if (!result?.data) {
        toast.error(result?.serverError ?? "That selection has expired. Connect again from Chat.");
        return;
      }
      toast.success("Page connected", { description: "Messages will start arriving in Chat." });
      router.push("/chat");
    });
  }

  return (
    <div className="max-w-xl space-y-4">
      <ul className="divide-y overflow-hidden rounded-lg border">
        {pages.map((page) => (
          <li key={page.id}>
            <button
              type="button"
              onClick={() => setChosen(page.id)}
              className={cn("flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm hover:bg-muted/60", chosen === page.id && "bg-muted")}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{page.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {page.instagramUsername ? `Instagram: @${page.instagramUsername}` : "Facebook page"}
                </span>
              </span>
              {chosen === page.id && <Check className="size-4 shrink-0" />}
            </button>
          </li>
        ))}
      </ul>
      <Button onClick={connect} disabled={isPending || !chosen}>
        {isPending && <Spinner />}
        Connect this page
      </Button>
    </div>
  );
}
