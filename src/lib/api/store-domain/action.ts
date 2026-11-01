"use server";

import { updateTag } from "next/cache";
import { updateTenantCookie } from "@/lib/api/session";
import { authActionClient } from "@/lib/safe-action";
import { checkSubdomainAvailability, updateStoreDomain } from "./service";
import { STORE_DOMAIN_TAG } from "./constants";
import { CheckSubdomainSchema, UpdateStoreDomainSchema } from "./validation";

export const checkStoreAddressAction = authActionClient.inputSchema(CheckSubdomainSchema).action(async ({ parsedInput }) => {
  return checkSubdomainAvailability(parsedInput.subdomain);
});

export const updateStoreAddressAction = authActionClient.inputSchema(UpdateStoreDomainSchema).action(async ({ parsedInput }) => {
  const domain = await updateStoreDomain(parsedInput.subdomain);
  updateTag(STORE_DOMAIN_TAG);
  // The shell's "visit your store" link reads this cookie, not another API call.
  await updateTenantCookie({ subdomain: domain.subdomain, storefrontHost: domain.host });
  return { domain };
});
