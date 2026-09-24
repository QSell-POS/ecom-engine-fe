"use server";
import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { createBrand, deleteBrand, updateBrand } from "@/lib/api/brand/service";
import {
  CreateBrandSchema,
  DeleteBrandSchema,
  UpdateBrandSchema,
} from "./validation";

export const createBrandAction = authActionClient
  .inputSchema(CreateBrandSchema)
  .action(async ({ parsedInput }) => {
    const brand = await createBrand(parsedInput);
    updateTag("brands");
    return { brand };
  });

export const updateBrandAction = authActionClient
  .inputSchema(UpdateBrandSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    const brand = await updateBrand(id, data);

    updateTag("brands");
    updateTag(`brand-${id}`);

    return { brand };
  });

export const deleteBrandAction = authActionClient
  .inputSchema(DeleteBrandSchema)
  .action(async ({ parsedInput }) => {
    await deleteBrand(parsedInput.id);

    updateTag("brands");
    updateTag(`brand-${parsedInput.id}`);

    return { success: true };
  });

export async function deleteBrandFromForm(formData: FormData) {
  const id = formData.get("id");

  if (typeof id !== "string") {
    throw new Error("A brand id is required.");
  }

  await deleteBrandAction({ id });
}
