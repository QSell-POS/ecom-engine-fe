import { createSafeActionClient } from "next-safe-action";
import { ApiError } from "@/lib/api/client";
import { getCustomerToken, getOwnerToken, getTenantSummary } from "@/lib/api/session";

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    console.error("Action error:", error);

    if (error instanceof ApiError) {
      const errors = error.data as { errors?: Record<string, string[]> } | undefined;
      const details = errors?.errors
        ? Object.entries(errors.errors)
            .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
            .join("; ")
        : "";

      if (details) return `${error.message}: ${details}`;
      return error.message;
    }

    return "Something went wrong. Please try again.";
  },
});

/**
 * Actions that call owner-authenticated API routes. The owner JWT lives in an
 * httpOnly cookie; `apiClient` attaches it, so this only has to refuse early
 * (with a message the form can show) when there's no session at all.
 */
export const authActionClient = actionClient.use(async ({ next }) => {
  const token = await getOwnerToken();
  if (!token) throw new ApiError(401, "Your session has expired. Please sign in again.");

  return next({ ctx: { token, tenant: await getTenantSummary() } });
});

/**
 * Storefront actions that act on behalf of a signed-in shopper. The customer
 * JWT is also httpOnly, so the browser never holds it.
 */
export const customerActionClient = actionClient.use(async ({ next }) => {
  const token = await getCustomerToken();
  if (!token) throw new ApiError(401, "Please sign in to continue.");

  return next({ ctx: { token } });
});
