import "server-only";
import { getCustomerToken, getOwnerToken } from "./session";
import type { ListResponse } from "./shared/types";

/**
 * The one way this app talks to the ecom-engine API.
 *
 * The API accepts three credentials, and every route wants exactly one of
 * them:
 *
 * | `auth`       | Headers sent                              | Used by            |
 * | ------------ | ----------------------------------------- | ------------------ |
 * | `"public"`   | none                                      | /health, /tenant/login, payment callbacks |
 * | `"key"`      | `x-api-key`                               | public catalog reads, customer register/login |
 * | `"owner"`    | `x-api-key` + owner `Authorization`       | /admin/*, /api-keys, /tenant/me |
 * | `"customer"` | `x-api-key` + customer `Authorization`    | cart, orders, address, wishlist |
 *
 * `auth` is inferred from the path when it isn't passed (see `inferAuth`), so
 * existing call sites keep working; pass it explicitly when the path is
 * ambiguous. Note that owner/customer modes read a cookie, which opts the
 * caller into dynamic rendering — that's correct for the dashboard, and the
 * reason catalog reads must stay on `"key"`.
 */
export type ApiAuth = "public" | "key" | "owner" | "customer";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  tags?: string[];
  revalidate?: number | false;
  /** Credential to use. Inferred from the endpoint when omitted. */
  auth?: ApiAuth;
  /** Overrides the cookie token (e.g. straight after a login call). */
  token?: string;
  /** Return null instead of throwing on 404. */
  allow404?: boolean;
};

/**
 * Every successful response is wrapped: `{ success, message, data, meta? }`.
 * Two routes are not — /tenant/register and /tenant/login return their body
 * directly — so unwrapping is conditional on the envelope being there.
 */
type Envelope = { success: boolean; message?: string; data: unknown; meta?: unknown };

function isEnvelope(body: unknown): body is Envelope {
  return Boolean(body) && typeof body === "object" && typeof (body as Envelope).success === "boolean" && "data" in (body as Envelope);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

// Read lazily, not at module load: a Docker image is built without runtime
// secrets, and `next build` must not fail for a missing API_URL.
function apiUrl(): string {
  const url = process.env.API_URL;
  if (!url) throw new ApiError(500, "API_URL is not configured on the server.");
  return url.replace(/\/$/, "");
}

function apiKey(): string {
  const key = process.env.API_KEY;
  if (!key) throw new ApiError(500, "API_KEY is not configured on the server.");
  return key;
}

/** Paths that need the owner JWT even though they don't start with /admin. */
const OWNER_PREFIXES = ["/admin", "/api-keys", "/tenant/me"];

function inferAuth(endpoint: string): ApiAuth {
  return OWNER_PREFIXES.some((prefix) => endpoint === prefix || endpoint.startsWith(`${prefix}/`) || endpoint.startsWith(`${prefix}?`))
    ? "owner"
    : "key";
}

async function authHeaders(auth: ApiAuth, override?: string): Promise<Record<string, string>> {
  if (auth === "public") return {};
  const headers: Record<string, string> = { "x-api-key": apiKey() };
  if (auth === "key") return headers;

  const token = override ?? (auth === "owner" ? await getOwnerToken() : await getCustomerToken());
  if (!token) {
    throw new ApiError(401, auth === "owner" ? "Your session has expired. Please sign in again." : "Please sign in to continue.");
  }
  headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", headers = {}, body, tags, revalidate = false, auth = inferAuth(endpoint), token, allow404 = false } = options;

  const credentials = await authHeaders(auth, token);

  let res: Response;
  try {
    res = await fetch(`${apiUrl()}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
        ...credentials,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      next: { tags, revalidate },
    });
  } catch (cause) {
    throw new ApiError(503, "Can't reach the API server. Check that it's running and try again.", { cause });
  }

  if (res.status === 204) return null as T;
  if (allow404 && res.status === 404) return null as T;

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, messageFrom(payload) ?? res.statusText ?? "Request failed", payload);
  }

  return (isEnvelope(payload) ? payload.data : payload) as T;
}

/**
 * A list endpoint: returns `data` and `meta` together, so callers get the
 * total/page (or the chat inbox's `nextCursor`) alongside the rows.
 */
export async function apiList<T>(endpoint: string, options: RequestOptions = {}): Promise<ListResponse<T>> {
  const { method = "GET", headers = {}, body, tags, revalidate = false, auth = inferAuth(endpoint), token } = options;

  const credentials = await authHeaders(auth, token);

  let res: Response;
  try {
    res = await fetch(`${apiUrl()}${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json", Accept: "application/json", ...headers, ...credentials },
      body: body === undefined ? undefined : JSON.stringify(body),
      next: { tags, revalidate },
    });
  } catch (cause) {
    throw new ApiError(503, "Can't reach the API server. Check that it's running and try again.", { cause });
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, messageFrom(payload) ?? res.statusText ?? "Request failed", payload);

  if (isEnvelope(payload)) {
    const rows = Array.isArray(payload.data) ? (payload.data as T[]) : [];
    return { data: rows, meta: payload.meta as ListResponse<T>["meta"] };
  }
  // Defensive: an endpoint that returns a bare array.
  return { data: Array.isArray(payload) ? (payload as T[]) : [] };
}

function messageFrom(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const body = data as { message?: unknown; error?: unknown };
  if (typeof body.message === "string") return body.message;
  // NestJS validation pipes return message as string[].
  if (Array.isArray(body.message)) return body.message.filter((m) => typeof m === "string").join("; ") || undefined;
  if (typeof body.error === "string") return body.error;
  return undefined;
}

/** Multipart upload (media). Same credentials, no JSON content type. */
export async function apiUpload<T>(endpoint: string, form: FormData, options: { auth?: ApiAuth; token?: string } = {}): Promise<T> {
  const credentials = await authHeaders(options.auth ?? inferAuth(endpoint), options.token);

  let res: Response;
  try {
    res = await fetch(`${apiUrl()}${endpoint}`, { method: "POST", headers: { Accept: "application/json", ...credentials }, body: form });
  } catch (cause) {
    throw new ApiError(503, "Can't reach the API server. Check that it's running and try again.", { cause });
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, messageFrom(data) ?? "Upload failed", data);
  return data as T;
}
