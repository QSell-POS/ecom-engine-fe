import { createSafeActionClient } from "next-safe-action";
import { ApiError } from "@/lib/api/client";

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    console.error("Action error:", error);

    if (error instanceof ApiError) {
      return error.message;
    }

    return "Something went wrong. Please try again.";
  },
});

// Authenticated version (optional)
export const authActionClient = actionClient.use(async ({ next }) => {
  // Replace with your real auth logic later
  // const session = await auth();
  // if (!session?.user) throw new Error("Unauthorized");

  return next({
    ctx: { user: { id: "demo-user" } }, // temporary
  });
});
