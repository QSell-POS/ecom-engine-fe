import type { CustomerApi } from "../contracts";
import { StorefrontError } from "../checkout";

// HTTP customer client for the NestJS storefront API. Runs in the browser;
// the session and guest cart live in httpOnly cookies set by the API, so no
// tokens are handled here.

export function createHttpCustomerApi({ baseUrl, storeKey }: { baseUrl: string; storeKey: string }): CustomerApi {
  async function call<T>(method: string, path: string, body?: unknown, { allow404 = false } = {}): Promise<T> {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}${path}`, {
      method,
      credentials: "include",
      headers: { "x-storefront-key": storeKey, accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (allow404 && response.status === 404) return null as T;
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new StorefrontError(data?.message ?? "Something went wrong. Please try again.", response.status);
    return data as T;
  }

  return {
    getCart: () => call("GET", "/storefront/cart"),
    addToCart: (input) => call("POST", "/storefront/cart/lines", input),
    updateCartLine: (lineId, quantity) => call("PATCH", `/storefront/cart/lines/${lineId}`, { quantity }),
    removeCartLine: (lineId) => call("DELETE", `/storefront/cart/lines/${lineId}`),

    getWishlist: () => call("GET", "/storefront/wishlist"),
    addToWishlist: (productId) => call("POST", "/storefront/wishlist", { productId }),
    removeFromWishlist: (productId) => call("DELETE", `/storefront/wishlist/${productId}`),

    getCustomer: async () => {
      try {
        return await call("GET", "/storefront/auth/me");
      } catch (error) {
        if (error instanceof StorefrontError && error.status === 401) return null;
        throw error;
      }
    },
    login: (input) => call("POST", "/storefront/auth/login", input),
    register: (input) => call("POST", "/storefront/auth/register", input),
    logout: () => call("POST", "/storefront/auth/logout"),
    requestPasswordReset: (email) => call("POST", "/storefront/auth/forgot-password", { email }),
    updateProfile: (patch) => call("PATCH", "/storefront/account", patch),

    listAddresses: () => call("GET", "/storefront/account/addresses"),
    saveAddress: ({ id, ...input }) =>
      id ? call("PUT", `/storefront/account/addresses/${id}`, input) : call("POST", "/storefront/account/addresses", input),
    deleteAddress: (id) => call("DELETE", `/storefront/account/addresses/${id}`),

    listOrders: () => call("GET", "/storefront/account/orders"),
    getOrder: (id) => call("GET", `/storefront/orders/${id}`, undefined, { allow404: true }),
    placeOrder: (input) => call("POST", "/storefront/checkout", input),

    submitReview: (input) => call("POST", `/storefront/products/${input.productId}/reviews`, input),
  };
}
