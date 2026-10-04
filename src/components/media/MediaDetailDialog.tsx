"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { updateMediaAction } from "@/lib/api/media-library/action";
import type { MediaAsset } from "@/lib/api/media-library/types";

/** Alt text and title only — the uploaded file itself is immutable. */
export function MediaDetailDialog({ asset, onClose }: { asset: MediaAsset; onClose: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [alt, setAlt] = useState(asset.alt ?? "");
  const [title, setTitle] = useState(asset.title ?? "");

  function save() {
    startTransition(async () => {
      const result = await updateMediaAction({ id: asset.id, alt, title });
      if (!result?.data) {
        toast.error(result?.serverError ?? "Could not save those details.");
        return;
      }
      toast.success("Details saved");
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Image details</DialogTitle>
          <DialogDescription>Alt text is read aloud by screen readers and shown when the image cannot load.</DialogDescription>
        </DialogHeader>

        {/* eslint-disable-next-line @next/next/no-img-element -- the R2 host is configured per deployment */}
        <img src={asset.url} alt={asset.alt ?? ""} className="max-h-64 w-full rounded-md border object-contain" />

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="media-alt">Alt text</Label>
            <Input id="media-alt" value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Teddy bear, front view" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="media-title">Title</Label>
            <Input id="media-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground" title={asset.url}>
            {asset.url}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={isPending}>
            {isPending && <Spinner />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
