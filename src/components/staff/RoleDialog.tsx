"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createRoleAction, updateRoleAction } from "@/lib/api/rbac/action";
import { expandGrant } from "@/lib/api/rbac/permissions";
import type { Role } from "@/lib/api/rbac/types";
import { PermissionMatrix } from "./PermissionMatrix";

export type RoleDialogMode = { kind: "create"; from?: Role } | { kind: "edit"; role: Role } | { kind: "view"; role: Role };

function initialPermissions(mode: RoleDialogMode) {
  const source = mode.kind === "create" ? mode.from : mode.role;
  return new Set((source?.permissions ?? []).flatMap(expandGrant));
}

function RoleForm({ mode, onDone }: { mode: RoleDialogMode; onDone: (saved: boolean) => void }) {
  const existing = mode.kind === "create" ? undefined : mode.role;
  const readOnly = mode.kind === "view";
  const [name, setName] = useState(mode.kind === "create" ? (mode.from ? `${mode.from.name} (copy)` : "") : mode.role.name);
  const [description, setDescription] = useState(mode.kind === "create" ? (mode.from?.description ?? "") : (mode.role.description ?? ""));
  const [permissions, setPermissions] = useState(() => initialPermissions(mode));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    if (!name.trim()) return setError("Give the role a name.");
    if (permissions.size === 0) return setError("Pick at least one permission.");
    startTransition(async () => {
      setError(null);
      const payload = { name: name.trim(), description: description.trim() || undefined, permissions: [...permissions].sort() };
      const result = existing ? await updateRoleAction({ id: existing.id, ...payload }) : await createRoleAction(payload);
      if (!result?.data) return setError(result?.serverError ?? "Couldn't save this role.");
      toast.success(existing ? "Role saved" : `${payload.name} created`);
      onDone(true);
    });
  }

  const title = mode.kind === "view" ? mode.role.name : mode.kind === "edit" ? `Edit ${mode.role.name}` : "New role";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {readOnly
            ? "A built-in role. It can't be changed, but you can copy it into a custom role and adjust that."
            : existing?.staffCount
              ? `Changes apply right away to the ${existing.staffCount} staff ${existing.staffCount === 1 ? "member" : "members"} with this role.`
              : "Pick what people with this role can do. Viewing a section is included whenever any other action in it is picked."}
        </DialogDescription>
      </DialogHeader>
      {!readOnly && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="role-name">Name</FieldLabel>
            <Input id="role-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <Field>
            <FieldLabel htmlFor="role-description">
              Description <span className="font-normal text-muted-foreground">(optional)</span>
            </FieldLabel>
            <Input id="role-description" value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
      )}
      <PermissionMatrix value={permissions} onChange={setPermissions} readOnly={readOnly} />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={() => onDone(false)} disabled={isPending}>
          {readOnly ? "Close" : "Cancel"}
        </Button>
        {!readOnly && (
          <Button onClick={save} disabled={isPending}>
            {isPending && <Spinner />}
            {existing ? "Save role" : "Create role"}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

export function RoleDialog({ mode, onClose }: { mode: RoleDialogMode | null; onClose: () => void }) {
  const router = useRouter();
  return (
    <Dialog open={Boolean(mode)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        {mode && (
          <RoleForm
            key={mode.kind === "create" ? `create-${mode.from?.id ?? "new"}` : `${mode.kind}-${mode.role.id}`}
            mode={mode}
            onDone={(saved) => {
              onClose();
              if (saved) router.refresh();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
