"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/lib/safe-action";
import { optionalText } from "@/lib/api/shared/validation";
import { deleteMediaAsset, updateMediaAsset, uploadMedia } from "./service";
import { MEDIA_FOLDERS } from "./types";
import { MEDIA_TAG, mediaTag } from "./constants";

const MediaIdSchema = z.object({ id: z.string().min(1, "Asset id is required") });

export const uploadMediaAction = authActionClient
  .inputSchema(
    z.object({
      files: z.array(z.instanceof(File)).min(1, "Pick an image").max(20, "Up to 20 images at a time"),
      folder: z.enum(MEDIA_FOLDERS).optional(),
      alt: optionalText,
    }),
  )
  .action(async ({ parsedInput }) => {
    const assets = await uploadMedia(parsedInput.files, { folder: parsedInput.folder, alt: parsedInput.alt });
    updateTag(MEDIA_TAG);
    return { assets };
  });

export const updateMediaAction = authActionClient
  .inputSchema(MediaIdSchema.extend({ alt: optionalText, title: optionalText }))
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    const asset = await updateMediaAsset(id, data);
    updateTag(MEDIA_TAG);
    updateTag(mediaTag(id));
    return { asset };
  });

export const deleteMediaAction = authActionClient.inputSchema(MediaIdSchema).action(async ({ parsedInput }) => {
  await deleteMediaAsset(parsedInput.id);
  updateTag(MEDIA_TAG);
  updateTag(mediaTag(parsedInput.id));
  return { success: true };
});
