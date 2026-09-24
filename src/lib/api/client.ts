import "server-only";

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

if (!API_URL) throw new Error("API_URL is not configured on the server.");
if (!API_KEY) throw new Error("API_KEY not set in env");

export const apiHeaders: Record<string, string> = {
  "x-api-key": API_KEY || "",
};

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  tags?: string[];
  revalidate?: number | false;
  token?: string;
};

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

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    headers = {},
    body,
    tags,
    revalidate = false,
    token,
  } = options;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
      ...apiHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
    next: { tags, revalidate },
  });

  if (res.status === 204) return null as T;
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.message || data?.error || res.statusText || "Request failed",
      data,
    );
  }

  return data as T;
}
