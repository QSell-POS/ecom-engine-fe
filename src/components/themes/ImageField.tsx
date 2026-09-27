"use client";

/* eslint-disable @next/next/no-img-element -- previews of uploaded data URLs / CDN images */
import { useRef, useState } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ACCEPTED_IMAGE_TYPES, uploadImage } from "@/lib/api/media";
import { cn } from "@/lib/utils";

/** Drop or pick an image; shows a preview and hands back its URL. */
export function ImageField({
  id,
  value,
  onChange,
  hint,
  maxSize = 1200,
  previewClassName,
  emptyLabel = "Drop an image here, or click to upload",
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
  hint?: string;
  maxSize?: number;
  previewClassName?: string;
  emptyLabel?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function accept(file: File | undefined) {
    if (!file) return;
    setError("");
    setBusy(true);
    try {
      onChange(await uploadImage(file, { maxSize }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input ref={input} id={id} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} className="sr-only" onChange={(e) => accept(e.target.files?.[0])} />
      {value ? (
        <div className="flex items-center gap-4 rounded-md border bg-card p-3">
          <div className={cn("flex h-16 w-28 shrink-0 items-center justify-center rounded-sm bg-[repeating-conic-gradient(var(--muted)_0_25%,transparent_0_50%)] bg-size-[12px_12px] p-2", previewClassName)}>
            <img src={value} alt="" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
              {busy ? <Spinner /> : <Upload />} Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <Trash2 /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void accept(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground",
            dragging && "border-selection bg-selection/5 text-foreground",
          )}
        >
          {busy ? <Spinner /> : <ImagePlus className="size-5" />}
          {emptyLabel}
        </button>
      )}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
