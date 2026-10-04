export type ApiKeyScope = "storefront";

export type ApiKey = {
  id: string;
  name: string;
  /** The visible head of the key, e.g. "ek_live_a1b2c3d4". */
  keyPrefix: string;
  /** The full secret. Present only in the POST response, never again. */
  key?: string;
  scopes?: ApiKeyScope[];
  isActive?: boolean;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
