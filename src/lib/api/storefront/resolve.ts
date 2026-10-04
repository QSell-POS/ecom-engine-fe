/**
 * Turning a request host into a store.
 *
 * `/storefront/resolve` needs no credential, which is what lets `proxy.ts`
 * call it before anything is rendered. Three answers:
 *
 * - `active` — render this store;
 * - `moved` — the merchant renamed it: 301 to `host`, do not render. The data
 *   routes refuse the old address, so skipping the redirect turns a rename
 *   into a broken store rather than a working one;
 * - `unknown` — unknown, malformed or suspended: render the 404 page.
 */
export type ResolvedStore = {
  id: string;
  name: string;
  subdomain: string;
  host: string;
};

export type HostResolution =
  | { status: "active"; store: ResolvedStore }
  | { status: "moved"; from: string; subdomain: string; host: string }
  | { status: "unknown" };

type Envelope = { data?: { status?: string; store?: ResolvedStore; from?: string; subdomain?: string; host?: string } };

export async function resolveStoreHost(apiUrl: string, host: string, signal?: AbortSignal): Promise<HostResolution> {
  let response: Response;
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, "")}/storefront/resolve?host=${encodeURIComponent(host)}`, {
      headers: { Accept: "application/json" },
      signal,
    });
  } catch {
    // The API being unreachable is not the same as the store not existing, but
    // there is nothing to render either way.
    return { status: "unknown" };
  }

  if (!response.ok) return { status: "unknown" };

  const body = (await response.json().catch(() => null)) as Envelope | null;
  const data = body?.data;

  if (data?.status === "active" && data.store) return { status: "active", store: data.store };
  if (data?.status === "moved" && data.host && data.subdomain) {
    return { status: "moved", from: data.from ?? host, subdomain: data.subdomain, host: data.host };
  }
  return { status: "unknown" };
}
