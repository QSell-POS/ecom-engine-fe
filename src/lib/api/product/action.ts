"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { createProduct, deleteProduct, updateProduct } from "./service";
import { PRODUCTS_TAG, productTag } from "./constants";
import {
  CreateProductSchema,
  DeleteProductSchema,
  UpdateProductSchema,
} from "./validation";

export const createProductAction = authActionClient
  .inputSchema(CreateProductSchema)
  .action(async ({ parsedInput }) => {
    const product = await createProduct(parsedInput);
    updateTag(PRODUCTS_TAG);
    return { product };
  });

export const updateProductAction = authActionClient
  .inputSchema(UpdateProductSchema)
  .action(async ({ parsedInput }) => {
    const product = await updateProduct(parsedInput);
    updateTag(PRODUCTS_TAG);
    updateTag(productTag(parsedInput.id));
    return { product };
  });

export const deleteProductAction = authActionClient
  .inputSchema(DeleteProductSchema)
  .action(async ({ parsedInput }) => {
    await deleteProduct(parsedInput.id);
    updateTag(PRODUCTS_TAG);
    updateTag(productTag(parsedInput.id));
    return { success: true };
  });

export async function deleteProductFromForm(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("A product id is required.");
  await deleteProductAction({ id });
}
