"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { authActionClient } from "@/lib/safe-action";
import { BRANDS_TAG } from "@/lib/api/brand/constants";
import { CATEGORIES_TAG } from "@/lib/api/category/constants";
import { INVENTORY_TAG } from "@/lib/api/inventory/constants";
import { MEDIA_TAG } from "@/lib/api/media-library/constants";
import { PRODUCTS_TAG } from "@/lib/api/product/constants";
import { getSeedStatus, removeSeededCatalog, seedCatalog } from "./service";

function revalidateCatalog() {
  updateTag(PRODUCTS_TAG);
  updateTag(BRANDS_TAG);
  updateTag(CATEGORIES_TAG);
  updateTag(INVENTORY_TAG);
  updateTag(MEDIA_TAG);
}

export const getSeedStatusAction = authActionClient.inputSchema(z.object({})).action(async () => {
  return { status: await getSeedStatus() };
});

export const seedCatalogAction = authActionClient
  .inputSchema(
    z.object({
      brands: z.coerce.number().int().min(1).max(100).optional(),
      categories: z.coerce.number().int().min(1).max(100).optional(),
      products: z.coerce.number().int().min(1).max(500).optional(),
      withImages: z.boolean().optional(),
      reset: z.boolean().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const result = await seedCatalog(parsedInput);
    revalidateCatalog();
    return { result };
  });

export const removeSeededCatalogAction = authActionClient.inputSchema(z.object({})).action(async () => {
  const removed = await removeSeededCatalog();
  revalidateCatalog();
  return { removed };
});
