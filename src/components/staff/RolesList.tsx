"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/components/auth/PermissionsProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteRoleAction } from "@/lib/api/rbac/action";
import { expandGrant, MODULES, moduleLabel, type PermissionModule } from "@/lib/api/rbac/permissions";
import type { Role } from "@/lib/api/rbac/types";
import { RoleDialog, type RoleDialogMode } from "./RoleDialog";

/** "Orders, Customers and 3 more": which sections a role reaches at all. */
function summary(role: Role) {
  const granted = new Set(role.permissions.flatMap(expandGrant));
  const modules = (Object.keys(MODULES) as PermissionModule[]).filter((m) => MODULES[m].some((a) => granted.has(`${m}:${a}`)));
  if (modules.length === Object.keys(MODULES).length) return "Everything";
  const names = modules.map(moduleLabel);
  return names.length > 4 ? `${names.slice(0, 4).join(", ")} and ${names.length - 4} more` : names.join(", ");
}

function RoleCard({ role, onOpen, onDelete }: { role: Role; onOpen: (mode: RoleDialogMode) => void; onDelete: (role: Role) => void }) {
  const canManage = useCan("staff:manage");
  return (
    <li className="flex flex-col gap-3 rounded-md border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{role.name}</h3>
          {role.builtIn ? <Badge variant="outline">Built-in</Badge> : <Badge variant="secondary">Custom</Badge>}
          <span className="text-xs text-muted-foreground">
            {role.staffCount} {role.staffCount === 1 ? "person" : "people"}
          </span>
        </div>
        {role.description && <p className="text-sm text-muted-foreground">{role.description}</p>}
        <p className="text-sm">
          <span className="text-muted-foreground">Access: </span>
          {summary(role)}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {role.builtIn || !canManage ? (
          <Button variant="outline" size="sm" onClick={() => onOpen({ kind: "view", role })}>
            <Eye /> View
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => onOpen({ kind: "edit", role })}>
            <Pencil /> Edit
          </Button>
        )}
        {canManage && (
          <Button variant="ghost" size="sm" onClick={() => onOpen({ kind: "create", from: role })}>
            <Copy /> Copy
          </Button>
        )}
        {canManage && !role.builtIn && (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(role)}>
            <Trash2 /> Delete
          </Button>
        )}
      </div>
    </li>
  );
}

export function RolesList({ roles }: { roles: Role[] }) {
  const router = useRouter();
  const canManage = useCan("staff:manage");
  const [mode, setMode] = useState<RoleDialogMode | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [isPending, startTransition] = useTransition();
  const builtIn = roles.filter((r) => r.builtIn);
  const custom = roles.filter((r) => !r.builtIn);

  function confirmDelete() {
    if (!deleting) return;
    const role = deleting;
    startTransition(async () => {
      const result = await deleteRoleAction({ id: role.id });
      setDeleting(null);
      if (!result?.data) return void toast.error(result?.serverError ?? "Couldn't delete this role.");
      toast.success(`${role.name} deleted`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold">Your roles</h2>
            <p className="text-sm text-muted-foreground">Roles you made for your store.</p>
          </div>
          {canManage && (
            <Button onClick={() => setMode({ kind: "create" })}>
              <Plus /> New role
            </Button>
          )}
        </div>
        {custom.length ? (
          <ul className="space-y-3">
            {custom.map((role) => (
              <RoleCard key={role.id} role={role} onOpen={setMode} onDelete={setDeleting} />
            ))}
          </ul>
        ) : (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No custom roles yet. Copy a built-in role below to start from it, or create one from scratch.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Built-in roles</h2>
          <p className="text-sm text-muted-foreground">Ready to use, and kept up to date for you.</p>
        </div>
        <ul className="space-y-3">
          {builtIn.map((role) => (
            <RoleCard key={role.id} role={role} onOpen={setMode} onDelete={setDeleting} />
          ))}
        </ul>
      </section>

      <RoleDialog mode={mode} onClose={() => setMode(null)} />

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.staffCount
                ? `${deleting.staffCount} staff ${deleting.staffCount === 1 ? "member still has" : "members still have"} this role. Move them to another role first.`
                : "This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending || Boolean(deleting?.staffCount)} onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
