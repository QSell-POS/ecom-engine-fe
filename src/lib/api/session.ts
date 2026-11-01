import "server-only";
import { cookies } from "next/headers";

/**
 * Where the two JWTs the API issues are kept.
 *
 * Both are httpOnly: the admin dashboard and the storefront only ever talk to
 * the API through server code (`lib/api/client.ts`), so no token is ever
 * handed to the browser. `ee_tenant` is the one readable cookie — it holds the
 * signed-in tenant's name/slug so the shell can render without a round trip.
 */
export const OWNER_TOKEN_COOKIE = "ee_owner_token";
export const CUSTOMER_TOKEN_COOKIE = "ee_customer_token";
export const TENANT_COOKIE = "ee_tenant";
export const CUSTOMER_COOKIE = "ee_customer";

/** Matches the API's own JWT lifetime; shorten here if the API shortens it. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function cookieOptions(maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export type TenantSummary = { id: string; name: string; slug?: string; email?: string; subdomain?: string | null; storefrontHost?: string | null };

/**
 * There is no `GET /customers/me` — the customer's identity comes from
 * whatever `/customers/login` or `/customers/register` returned, so it is
 * kept here the same way `TenantSummary` is: a readable cookie set at sign-in,
 * not a trust boundary (the httpOnly token is).
 */
export type CustomerSummary = { id: string; email: string; firstName?: string; lastName?: string; phone?: string | null };

export async function getOwnerToken(): Promise<string | undefined> {
  return (await cookies()).get(OWNER_TOKEN_COOKIE)?.value;
}

export async function getCustomerToken(): Promise<string | undefined> {
  return (await cookies()).get(CUSTOMER_TOKEN_COOKIE)?.value;
}

/** The tenant shown in the admin shell. Not a trust boundary — the token is. */
export async function getTenantSummary(): Promise<TenantSummary | null> {
  const raw = (await cookies()).get(TENANT_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TenantSummary;
  } catch {
    return null;
  }
}

// Writes only work inside a Server Action or Route Handler.
export async function setOwnerSession(token: string, tenant?: TenantSummary) {
  const jar = await cookies();
  jar.set(OWNER_TOKEN_COOKIE, token, cookieOptions());
  if (tenant) {
    jar.set(
      TENANT_COOKIE,
      JSON.stringify({
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        email: tenant.email,
        // Their storefront address, so the shell can link to it without a call.
        subdomain: tenant.subdomain,
        storefrontHost: tenant.storefrontHost,
      }),
      { ...cookieOptions(), httpOnly: false },
    );
  }
}

/** Patches the readable tenant cookie in place, e.g. after a store address rename. */
export async function updateTenantCookie(patch: Partial<TenantSummary>) {
  const current = (await getTenantSummary()) ?? ({} as TenantSummary);
  (await cookies()).set(TENANT_COOKIE, JSON.stringify({ ...current, ...patch }), { ...cookieOptions(), httpOnly: false });
}

export async function clearOwnerSession() {
  const jar = await cookies();
  jar.delete(OWNER_TOKEN_COOKIE);
  jar.delete(TENANT_COOKIE);
}

export async function getCustomerSummary(): Promise<CustomerSummary | null> {
  const raw = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CustomerSummary;
  } catch {
    return null;
  }
}

export async function setCustomerSession(token: string, customer: CustomerSummary) {
  const jar = await cookies();
  jar.set(CUSTOMER_TOKEN_COOKIE, token, cookieOptions());
  jar.set(
    CUSTOMER_COOKIE,
    JSON.stringify({ id: customer.id, email: customer.email, firstName: customer.firstName, lastName: customer.lastName, phone: customer.phone }),
    { ...cookieOptions(), httpOnly: false },
  );
}

export async function clearCustomerSession() {
  const jar = await cookies();
  jar.delete(CUSTOMER_TOKEN_COOKIE);
  jar.delete(CUSTOMER_COOKIE);
}
