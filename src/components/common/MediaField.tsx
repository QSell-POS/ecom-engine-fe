"use client";

import { useRef, useState, useTransition } from "react";
import { Controller, type FieldValues, type Path, type UseFormReturn } from "react-hook-form";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { uploadMediaAction } from "@/lib/api/media-library/action";
import type { MediaFolder } from "@/lib/api/media-library/types";

/**
 * An image field that stores a media asset **id**, because that is what the
 * API takes on write (`logoId`, `imageId`, `mediaIds`). The file is uploaded
 * to /admin/media as soon as it is picked, and the returned id goes into the
 * form; an explicit null clears the image.
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
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
            <input
              id={id}
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                startTransition(async () => {
                  const result = await uploadMediaAction({ files: [file], folder });
                  const asset = result?.data?.assets?.[0];
                  if (!asset) {
                    toast.error(result?.serverError ?? "That upload failed.");
                    return;
                  }
                  field.onChange(asset.id);
                  setPreview(asset.url);
                });
              }}
            />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => inputRef.current?.click()}>
                {isPending ? <Spinner /> : <ImagePlus />}
                {preview ? "Replace" : "Upload"}
              </Button>
              {preview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
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
          </div>
        )}
      />
      {description && !error && <FieldDescription>{description}</FieldDescription>}
      <FieldError>{error}</FieldError>
    </Field>
  );
}
