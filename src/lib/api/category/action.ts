"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { createCategory, deleteCategory, updateCategory } from "./service";
import {
  CreateCategorySchema,
  DeleteCategorySchema,
  UpdateCategorySchema,
} from "./validation";

export const createCategoryAction = authActionClient
  .inputSchema(CreateCategorySchema)
  .action(async ({ parsedInput }) => {
    const category = await createCategory(parsedInput);
    updateTag("categories");
    return { category };
  });

export const updateCategoryAction = authActionClient
  .inputSchema(UpdateCategorySchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    const category = await updateCategory(id, data);
    updateTag("categories");
    updateTag(`categories-${id}`);
    return { category };
  });

export const deleteCategoryAction = authActionClient
  .inputSchema(DeleteCategorySchema)
  .action(async ({ parsedInput }) => {
    await deleteCategory(parsedInput.id);
    updateTag("categories");
    updateTag(`categories-${parsedInput.id}`);
    return { success: true };
  });

export async function deleteCategoryFromForm(formData: FormData) {
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("A category id is required.");
  await deleteCategoryAction({ id });
}
