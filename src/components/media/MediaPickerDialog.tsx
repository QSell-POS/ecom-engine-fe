"use client";

/* eslint-disable @next/next/no-img-element -- R2 host is not in next.config images */
import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ImagePlus, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listMediaAction, uploadMediaAction } from "@/lib/api/media-library/action";
import type { MediaFolder } from "@/lib/api/media-library/types";
import { cn } from "@/lib/utils";

/** What a picker hands back: enough to store the id and show a preview. */
export type PickedMedia = { id: string; url: string; alt?: string | null };

type PickerProps = {
  /** Several images, kept in the order they were picked. */
  multiple?: boolean;
  /** Most images that may be selected at once (multiple mode). */
  max?: number;
  /** Folder new uploads are filed under. */
  folder?: MediaFolder;
  /** The current value; the picker opens with these already selected. */
  selected?: PickedMedia[];
  onConfirm: (media: PickedMedia[]) => void;
};

/**
 * WordPress-style media modal: pick from the library, or upload from the
 * device without leaving it. Every upload lands in the library first, so an
 * image is uploaded once and reused everywhere by id.
 */
export function MediaPickerDialog({
  open,
  onOpenChange,
  ...props
}: PickerProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-3xl">
        {/* Mounted only while open, so every opening starts from the current value and a fresh library page. */}
        {open && <MediaPicker {...props} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function MediaPicker({ multiple = false, max = 20, folder = "general", selected = [], onConfirm, onClose }: PickerProps & { onClose: () => void }) {
  const [tab, setTab] = useState<"library" | "upload">("library");
  const [assets, setAssets] = useState<PickedMedia[]>([]);
  const [picked, setPicked] = useState<PickedMedia[]>(selected);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Page 1 on open and on every (debounced) search; "Load more" appends.
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(
      async () => {
        setLoading(true);
        const result = await listMediaAction({ page, search: search.trim() || undefined });
        if (cancelled) return;
        setLoading(false);
        if (!result?.data) {
          setError(result?.serverError ?? "Couldn't load your media library.");
          return;
        }
        setError(null);
        const next = result.data.assets.map(({ id, url, alt }) => ({ id, url, alt }));
        setAssets((current) => (page === 1 ? next : [...current, ...next.filter((a) => !current.some((c) => c.id === a.id))]));
        setHasMore(result.data.hasMore);
      },
      page === 1 ? 250 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [page, search]);

  const position = (id: string) => picked.findIndex((media) => media.id === id);

  function toggle(asset: PickedMedia) {
    if (!multiple) {
      setPicked(position(asset.id) === 0 ? [] : [asset]);
      return;
    }
    if (position(asset.id) >= 0) {
      setPicked(picked.filter((media) => media.id !== asset.id));
    } else if (picked.length >= max) {
      toast.error(`Up to ${max} images.`);
    } else {
      setPicked([...picked, asset]);
    }
  }

  function upload(files: FileList | File[] | null) {
    const list = Array.from(files ?? []).filter((file) => file.type.startsWith("image/"));
    if (!list.length) return;
    const batch = multiple ? list.slice(0, Math.max(0, max - picked.length)) : list.slice(0, 1);
    if (!batch.length) {
      toast.error(`Up to ${max} images.`);
      return;
    }
    startUpload(async () => {
      const result = await uploadMediaAction({ files: batch, folder });
      const uploaded = result?.data?.assets?.map(({ id, url, alt }) => ({ id, url, alt }));
      if (!uploaded?.length) {
        toast.error(result?.serverError ?? "That upload failed.");
        return;
      }
      // New uploads go to the top of the library and are selected straight away.
      setAssets((current) => [...uploaded, ...current.filter((a) => !uploaded.some((u) => u.id === a.id))]);
      setPicked((current) => (multiple ? [...current, ...uploaded] : uploaded.slice(0, 1)));
      setTab("library");
      toast.success(`${uploaded.length} ${uploaded.length === 1 ? "image" : "images"} uploaded`);
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{multiple ? "Select images" : "Select an image"}</DialogTitle>
        <DialogDescription>
          {multiple
            ? "Pick from your media library or upload new images. The first one selected is the main image."
            : "Pick from your media library or upload a new image."}
        </DialogDescription>
      </DialogHeader>

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="min-h-0 flex-1">
        <TabsList>
          <TabsTrigger value="library">Media library</TabsTrigger>
          <TabsTrigger value="upload">Upload new</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="flex min-h-0 flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name"
              className="pl-8"
              aria-label="Search media"
            />
          </div>

          <div className="min-h-64 overflow-y-auto pr-1">
            {error ? (
              <p className="py-10 text-center text-sm text-destructive">{error}</p>
            ) : assets.length === 0 && !loading ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
                <p>{search ? "No images match that search." : "Your media library is empty."}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => setTab("upload")}>
                  <Upload /> Upload an image
                </Button>
              </div>
            ) : (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {assets.map((asset) => {
                  const index = position(asset.id);
                  return (
                    <li key={asset.id}>
                      <button
                        type="button"
                        onClick={() => toggle(asset)}
                        aria-pressed={index >= 0}
                        aria-label={asset.alt || "Image"}
                        className={cn(
                          "relative block aspect-square w-full overflow-hidden rounded-md border bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          index >= 0 && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        )}
                      >
                        <img src={asset.url} alt={asset.alt ?? ""} loading="lazy" className="size-full object-cover" />
                        {index >= 0 && (
                          <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                            {multiple ? index + 1 : <Check className="size-3" />}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {loading && (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            )}
            {hasMore && !loading && (
              <div className="flex justify-center pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
                  Load more
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              upload(event.dataTransfer.files);
            }}
            className={cn(
              "flex min-h-64 w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-sm text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              dragging && "border-primary bg-primary/5",
            )}
          >
            {isUploading ? <Spinner /> : <ImagePlus className="size-6" />}
            <span>
              {isUploading ? "Uploading…" : multiple ? "Drop images here, or click to browse" : "Drop an image here, or click to browse"}
            </span>
            <span className="text-xs">Uploads are saved to your media library.</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            onChange={(event) => {
              upload(event.target.files);
              event.target.value = "";
            }}
          />
        </TabsContent>
      </Tabs>

      <DialogFooter className="items-center sm:justify-between">
        <span className="text-sm text-muted-foreground">
          {multiple ? `${picked.length} selected` : picked.length ? "1 selected" : "Nothing selected"}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isUploading || (!multiple && picked.length === 0)}
            onClick={() => {
              onConfirm(picked);
              onClose();
            }}
          >
            {multiple ? "Use selected" : "Use image"}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
