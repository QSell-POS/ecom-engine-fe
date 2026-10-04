import type { ApiKeyScope } from "./types";

export type CreateApiKeyPayload = {
  name: string;
  /** Defaults to ["storefront"] server-side. */
  scopes?: ApiKeyScope[];
  /** ISO timestamp. */
  expiresAt?: string;
};
