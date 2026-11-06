"use client";

import { createContext, useContext, type ReactNode } from "react";
import { meCan, type Me, type Permission } from "@/lib/api/rbac/permissions";

const MeContext = createContext<Me | null>(null);

/**
 * Makes the signed-in admin available to client components. Filled once in the dashboard layout.
 * This only decides what is shown; the API enforces every permission on its own.
 */
export function PermissionsProvider({ me, children }: { me: Me | null; children: ReactNode }) {
  return <MeContext.Provider value={me}>{children}</MeContext.Provider>;
}

export function useMe() {
  return useContext(MeContext);
}

/** Whether the signed-in admin may do this. The owner may do everything; `"owner"` means the owner only. */
export function useCan(permission: Permission | "owner") {
  return meCan(useContext(MeContext), permission);
}

/** Returns a checker for many permissions at once, e.g. when filtering a list. */
export function useCanFn() {
  const me = useContext(MeContext);
  return (permission: Permission | "owner") => meCan(me, permission);
}

/** Renders its children only when the admin holds the permission. */
export function Can({ I, children, fallback = null }: { I: Permission | "owner"; children: ReactNode; fallback?: ReactNode }) {
  return useCan(I) ? children : fallback;
}
