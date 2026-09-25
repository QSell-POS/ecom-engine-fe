export const API_KEYS_TAG = "api-keys";

export function apiKeyTag(id: string) {
  return `api-key-${id}`;
}

export const API_KEY_PAGE_SIZE_OPTIONS = [10, 20, 30, 50];

export const API_KEY_ROUTES = {
  list: "/api-keys",
};
