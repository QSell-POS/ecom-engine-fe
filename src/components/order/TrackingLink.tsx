"use client";

import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** The order's public tracking page: copy it into any chat, SMS or email. */
export function TrackingLink({ url }: { url: string }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          navigator.clipboard.writeText(url).then(
            () => toast.success("Tracking link copied"),
            () => toast.error("Couldn't copy. Select the link and copy it instead."),
          )
        }
      >
        <Copy /> Copy link
      </Button>
      <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        Open <ExternalLink className="size-3.5" />
      </a>
    </span>
  );
}
