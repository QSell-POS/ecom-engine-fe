"use client";

import { useState } from "react";
import { Controller, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import { ImagePlus, X } from "lucide-react";
import { MediaPickerDialog } from "@/components/media/MediaPickerDialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import type { MediaFolder } from "@/lib/api/media-library/types";

/**
 * An image field that stores a media asset **id**, because that is what the
 * API takes on write (`logoId`, `imageId`). The image is chosen through the
 * media picker — from the library, or uploaded into it from there — and an
 * explicit null clears it.
 */
export function MediaField<T extends FieldValues, TOut extends FieldValues>({
  form,
  name,
  label,
  description,
  optional,
  folder = "general",
  currentUrl,
}: {
  form: UseFormReturn<T, unknown, TOut>;
  name: Path<T>;
  label: string;
  description?: string;
  optional?: boolean;
  folder?: MediaFolder;
  /** Existing image to show when the form opens on a saved record. */
  currentUrl?: string | null;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const error = form.getFieldState(name, form.formState).error?.message;
  const id = `field-${String(name)}`;

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </FieldLabel>
      <Controller
        name={name}
        control={form.control}
        render={({ field }) => (
          <div className="flex items-center gap-3">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- R2 host is not in next.config images
              <img src={preview} alt="" className="size-16 shrink-0 rounded-md border object-cover" />
            ) : (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                <ImagePlus className="size-5" />
              </span>
            )}
            <div className="flex items-center gap-2">
              <Button id={id} type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                <ImagePlus />
                {preview ? "Replace" : "Select image"}
              </Button>
              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // null, not undefined: that is how the API clears an image.
                    field.onChange(null);
                    setPreview(null);
                  }}
                >
                  <X /> Remove
                </Button>
              )}
            </div>
            <MediaPickerDialog
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              folder={folder}
              selected={field.value && preview ? [{ id: field.value as string, url: preview }] : []}
              onConfirm={([media]) => {
                if (!media) return;
                field.onChange(media.id);
                setPreview(media.url);
              }}
            />
          </div>
        )}
      />
      {description && !error && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
    </Field>
  );
}
