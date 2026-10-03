"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { actionClient } from "@/lib/safe-action";
import { clearCustomerSession, clearOwnerSession, setOwnerSession } from "@/lib/api/session";
import { loginTenant, registerTenant } from "./service";
import { AUTH_ROUTES, TENANT_TAG } from "./constants";
import { LoginSchema, RegisterSchema } from "./validation";

export const loginAction = actionClient.inputSchema(LoginSchema).action(async ({ parsedInput }) => {
  const { tenant, accessToken } = await loginTenant(parsedInput);
  await setOwnerSession(accessToken, tenant);
  updateTag(TENANT_TAG);
  return { tenant };
});

export const registerAction = actionClient.inputSchema(RegisterSchema).action(async ({ parsedInput }) => {
  const { tenant, accessToken } = await registerTenant(parsedInput);
  await setOwnerSession(accessToken, tenant);
  updateTag(TENANT_TAG);
  return { tenant };
});

export async function logoutAction() {
  // The API issues stateless JWTs, so signing out is dropping the cookies.
  await clearOwnerSession();
  await clearCustomerSession();
  redirect(AUTH_ROUTES.login);
}
