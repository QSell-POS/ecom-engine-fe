"use client";

/* eslint-disable @next/next/no-img-element -- R2 host is not in next.config images */
import { useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";
import { MediaPickerDialog, type PickedMedia } from "@/components/media/MediaPickerDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const MAX_PRODUCT_IMAGES = 20;

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * The product gallery. The order here is the order of `mediaIds` sent to the
 * API, and position 0 is the primary image — the one on product cards and at
 * the top of the product page. Reorder by dragging, or with "Make main".
 */
export function ProductMediaField({ value, onChange }: { value: PickedMedia[]; onChange: (media: PickedMedia[]) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((media, index) => (
            <li
              key={media.id}
              draggable
              onDragStart={(event) => {
                setDragFrom(index);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(index);
              }}
              onDragLeave={() => setDragOver((current) => (current === index ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                if (dragFrom !== null && dragFrom !== index) onChange(move(value, dragFrom, index));
                setDragFrom(null);
                setDragOver(null);
              }}
              onDragEnd={() => {
                setDragFrom(null);
                setDragOver(null);
              }}
              className={cn(
                "group relative aspect-square cursor-grab overflow-hidden rounded-md border bg-muted active:cursor-grabbing",
                index === 0 && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                dragOver === index && dragFrom !== index && "ring-2 ring-ring",
                dragFrom === index && "opacity-50",
              )}
            >
              <img src={media.url} alt={media.alt ?? ""} className="size-full object-cover" draggable={false} />
              {index === 0 && (
                <span className="absolute top-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[11px] font-medium text-primary-foreground">
                  Main
                </span>
              )}
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                {index > 0 && (
                  <Button type="button" size="icon" variant="secondary" className="size-7" aria-label="Make main image" title="Make main image" onClick={() => onChange(move(value, index, 0))}>
                    <Star />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="size-7"
                  aria-label="Remove image"
                  title="Remove image"
                  onClick={() => onChange(value.filter((item) => item.id !== media.id))}
                >
                  <X />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
        <ImagePlus /> {value.length ? "Add or change images" : "Add images"}
      </Button>
      <p className="text-sm text-muted-foreground">
        {value.length > 1 ? "Drag to reorder. The first image is the main one shown on product cards." : `Up to ${MAX_PRODUCT_IMAGES} images. The first one is the main image.`}
      </p>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        multiple
        max={MAX_PRODUCT_IMAGES}
        folder="product"
        selected={value}
        onConfirm={onChange}
      />
    </div>
  );
}
