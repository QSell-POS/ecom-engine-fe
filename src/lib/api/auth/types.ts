export type Tenant = {
  id: string;
  name: string;
  email: string;
  /** The tenant's Postgres schema, e.g. "tnt_OdjTfg3L". Informational only. */
  schemaName?: string;
  /** The storefront label, and the store's address: `<subdomain>.qsellpos.com`. */
  subdomain?: string | null;
  /** The full host, returned by register and login. */
  storefrontHost?: string | null;
  isActive?: boolean;
  shopId?: string | null;
  countryId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

/** POST /tenant/register: the tenant object itself, with the token on it. */
export type RegisterResponse = Tenant & { accessToken: string };

/** POST /tenant/login: the tenant nested, with the token beside it. */
export type LoginResponse = { tenant: Tenant; accessToken: string };

/** What both flows give the rest of the app. */
export type TenantSession = { tenant: Tenant; accessToken: string };
