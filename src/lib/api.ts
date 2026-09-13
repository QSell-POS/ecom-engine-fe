const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export const apiHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY ? API_KEY : "",
};

type Request = {
  endpoint: string;
  options?: RequestInit;
};

export async function apiFetch<T>({
  endpoint,
  options = {},
}: Request): Promise<T> {
  console.log(API_URL);
  console.log(API_KEY);
  const headers = {
    ...apiHeaders,
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers,
    cache: "no-store",
    ...options,
  });

  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export const fetchFromApi = apiFetch;
