import "server-only";
import { headers } from "next/headers";

/**
 * Which store a request is about.
 *
 * One deployment serves every tenant on `*.qsellpos.com`, so the store is not
 * configured at build time — it comes from the request's host. `proxy.ts`
 * resolves that host once and passes the answer down on this header, so the
 * rest of the app never parses a hostname itself.
 *
 * A `storefront` key (`ek_live_…`) already means one tenant and the API
 * ignores this header; a `platform` key (`ek_platform_…`) requires it. Sending
 * it always is correct for both.
 */
export const STORE_HOST_HEADER = "x-store-host";

export async function getStoreHost(): Promise<string | undefined> {
  const header = await headers();
  return header.get(STORE_HOST_HEADER) ?? undefined;
}
