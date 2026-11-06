"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ImagePlus, Trash2 } from "lucide-react";
import { useCan } from "@/components/auth/PermissionsProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { deleteMediaAction, uploadMediaAction } from "@/lib/api/media-library/action";
import { MEDIA_FOLDERS, type MediaAsset, type MediaFolder } from "@/lib/api/media-library/types";
import { MediaDetailDialog } from "./MediaDetailDialog";

const FOLDER_LABELS: Record<MediaFolder, string> = {
  general: "General",
  product: "Products",
  brand: "Brands",
  category: "Categories",
  logo: "Logos",
  banner: "Banners",
};

function sizeLabel(bytes?: number) {
  if (!bytes) return "";
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * The media library. Images are uploaded here or inline from a brand,
 * category or product form; either way the API stores the file and returns an
 * id, which is what every other record references.
 */
export function MediaLibrary({ assets }: { assets: MediaAsset[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [folder, setFolder] = useState<MediaFolder | "all">("all");
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const canUpload = useCan("media:upload");
  const canDelete = useCan("media:delete");

  const shown = folder === "all" ? assets : assets.filter((asset) => asset.folder === folder);

  function upload(files: FileList | null) {
    if (!files?.length) return;
    startTransition(async () => {
      const result = await uploadMediaAction({
        files: Array.from(files),
        folder: folder === "all" ? "general" : folder,
      });
      if (!result?.data) {
        toast.error(result?.serverError ?? "That upload failed.");
        return;
      }
      const count = result.data.assets.length;
      toast.success(`${count} ${count === 1 ? "image" : "images"} uploaded`);
      router.refresh();
    });
  }

  async function copyUrl(asset: MediaAsset) {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopied(asset.id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Could not copy. Select the address and copy it by hand.");
    }
  }

  function remove(asset: MediaAsset) {
    startTransition(async () => {
      const result = await deleteMediaAction({ id: asset.id });
      if (!result?.data) {
        toast.error(result?.serverError ?? "That image could not be deleted.");
        return;
      }
      toast.success("Image deleted", { description: "Anything using it has lost that image." });
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Select value={folder} onValueChange={(value) => setFolder(value as MediaFolder | "all")}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All folders</SelectItem>
            {MEDIA_FOLDERS.map((name) => (
              <SelectItem key={name} value={name}>
                {FOLDER_LABELS[name]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {shown.length} {shown.length === 1 ? "image" : "images"}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            upload(event.target.files);
            event.target.value = "";
          }}
        />
        {canUpload && (
          <Button className="ml-auto" disabled={isPending} onClick={() => inputRef.current?.click()}>
            {isPending ? <Spinner /> : <ImagePlus />}
            Upload
          </Button>
        )}
      </div>

      {shown.length === 0 ? (
        <Empty className="border py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ImagePlus />
            </EmptyMedia>
            <EmptyTitle>No images here</EmptyTitle>
            <EmptyDescription>Upload product photos, brand logos and banners once, then pick them from any form.</EmptyDescription>
          </EmptyHeader>
          {canUpload && (
            <EmptyContent>
              <Button disabled={isPending} onClick={() => inputRef.current?.click()}>
                <ImagePlus /> Upload images
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {shown.map((asset) => (
            <li key={asset.id} className="overflow-hidden rounded-lg border">
              <button type="button" onClick={() => setEditing(asset)} className="block w-full bg-muted/40" title="Edit details">
                {/* eslint-disable-next-line @next/next/no-img-element -- the R2 host is configured per deployment */}
                <img src={asset.url} alt={asset.alt ?? ""} className="aspect-square w-full object-cover" loading="lazy" />
              </button>
              <div className="flex items-center gap-1 border-t px-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={asset.originalName}>
                  {asset.originalName ?? asset.id.slice(0, 8)}
                  {asset.size ? ` · ${sizeLabel(asset.size)}` : ""}
                </span>
                <Button variant="ghost" size="icon" className="size-7" title="Copy address" onClick={() => copyUrl(asset)}>
                  {copied === asset.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    title="Delete"
                    disabled={isPending}
                    onClick={() => remove(asset)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && <MediaDetailDialog asset={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
