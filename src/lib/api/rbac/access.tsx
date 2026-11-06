import "server-only";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { meCan, permissionLabel, type Permission } from "./permissions";
import { getMe } from "./service";

/** Server-side check for pages and server components. */
export async function can(permission: Permission | "owner") {
  return meCan(await getMe(), permission);
}

function NoAccess({ permission }: { permission: Permission | "owner" }) {
  return (
    <Empty className="min-h-[60vh] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Lock />
        </EmptyMedia>
        <EmptyTitle>You don&apos;t have access to this page</EmptyTitle>
        <EmptyDescription>
          {permission === "owner"
            ? "Only the store owner can open this page."
            : `It needs the "${permissionLabel(permission)}" permission. Ask the store owner or an administrator to add it to your role.`}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

/**
 * A page guard. Call it first in a page and return what it gives back:
 *
 * ```tsx
 * const denied = await denyUnless("orders:view");
 * if (denied) return denied;
 * ```
 *
 * Rendering a message instead of a 403 keeps the sidebar and the way back.
 */
export async function denyUnless(permission: Permission | "owner") {
  return (await can(permission)) ? null : <NoAccess permission={permission} />;
}
