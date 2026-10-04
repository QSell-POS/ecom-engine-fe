"use server";

import { updateTag } from "next/cache";
import { authActionClient } from "@/lib/safe-action";
import { createCustomer, deleteCustomer, updateCustomerStatus } from "./service";
import { CUSTOMERS_TAG, customerTag } from "./constants";
import { CreateCustomerSchema, DeleteCustomerSchema, UpdateCustomerStatusSchema } from "./validation";

export const createCustomerAction = authActionClient.inputSchema(CreateCustomerSchema).action(async ({ parsedInput }) => {
  const customer = await createCustomer(parsedInput);
  updateTag(CUSTOMERS_TAG);
  return { customer };
});

export const updateCustomerStatusAction = authActionClient.inputSchema(UpdateCustomerStatusSchema).action(async ({ parsedInput }) => {
  const { id, status } = parsedInput;
  const customer = await updateCustomerStatus(id, { status });

  updateTag(CUSTOMERS_TAG);
  updateTag(customerTag(id));

  return { customer };
});

export const deleteCustomerAction = authActionClient.inputSchema(DeleteCustomerSchema).action(async ({ parsedInput }) => {
  await deleteCustomer(parsedInput.id);

  updateTag(CUSTOMERS_TAG);
  updateTag(customerTag(parsedInput.id));

  return { success: true };
});
