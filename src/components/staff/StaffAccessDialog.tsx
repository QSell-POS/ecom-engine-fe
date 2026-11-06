"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { setStaffOverridesAction } from "@/lib/api/rbac/action";
import { MODULES, resolvePermissions, type PermissionModule } from "@/lib/api/rbac/permissions";
import type { Override, Role, StaffMember } from "@/lib/api/rbac/types";
import { PermissionMatrix } from "./PermissionMatrix";

const ALL = (Object.keys(MODULES) as PermissionModule[]).flatMap((m) => MODULES[m].map((a) => `${m}:${a}`));

/** The overrides that turn what the role gives into what was picked: allow what was added, deny what was removed. */
function diff(fromRole: Set<string>, picked: Set<string>): Override[] {
  const overrides: Override[] = [];
  for (const permission of ALL) {
    if (picked.has(permission) && !fromRole.has(permission)) overrides.push({ permission, effect: "allow" });
    if (!picked.has(permission) && fromRole.has(permission)) overrides.push({ permission, effect: "deny" });
  }
  return overrides;
}

/**
 * One person's permissions, starting from their role. Ticking or unticking a box records an
 * exception for them alone, so nobody needs a one-off role.
 */
export function StaffAccessDialog({ staff, roles, open, onOpenChange }: { staff: StaffMember; roles: Role[]; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const role = roles.find((r) => r.id === staff.role?.id);
  const fromRole = useMemo(() => resolvePermissions(role?.permissions ?? []), [role]);
  const [picked, setPicked] = useState(() => resolvePermissions(role?.permissions ?? [], staff.overrides));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const overrides = diff(fromRole, picked);

  function save() {
    startTransition(async () => {
      setError(null);
      const result = await setStaffOverridesAction({ id: staff.id, overrides });
      if (!result?.data) return setError(result?.serverError ?? "Couldn't save these permissions.");
      toast.success(`Permissions updated for ${staff.name}`);
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Permissions for {staff.name}</DialogTitle>
          <DialogDescription>
            Starts from the {role ? <strong>{role.name}</strong> : "assigned"} role. Changes here apply to {staff.name} only and are marked as added or removed.
          </DialogDescription>
        </DialogHeader>
        <PermissionMatrix value={picked} onChange={setPicked} base={fromRole} />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" disabled={isPending || overrides.length === 0} onClick={() => setPicked(new Set(fromRole))}>
            Reset to role
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={isPending}>
              {isPending && <Spinner />}
              Save {overrides.length > 0 ? `(${overrides.length} custom)` : ""}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
