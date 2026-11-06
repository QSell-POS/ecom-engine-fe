"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleSlash, Pencil, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { DataGrid, type ActionOutcome, type RowAction } from "@/components/data-grid";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Can, useMe } from "@/components/auth/PermissionsProvider";
import { deleteStaffAction, updateStaffAction } from "@/lib/api/rbac/action";
import { staffColumns } from "@/lib/api/rbac/grid";
import type { Role, StaffMember } from "@/lib/api/rbac/types";
import { clientSource } from "@/lib/data-grid";
import { AddStaffButton, StaffDialog } from "./StaffDialog";
import { StaffAccessDialog } from "./StaffAccessDialog";

type SafeResult = { data?: unknown; serverError?: string } | undefined;

async function settle(result: Promise<SafeResult>, message: string): Promise<ActionOutcome> {
  const settled = await result;
  return settled?.data ? { ok: true, message } : { ok: false, error: settled?.serverError ?? "That didn't work. Please try again." };
}

export function StaffGrid({ staff, roles }: { staff: StaffMember[]; roles: Role[] }) {
  const router = useRouter();
  const me = useMe();
  const source = useMemo(() => clientSource(staff), [staff]);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [access, setAccess] = useState<StaffMember | null>(null);
  // Nobody changes their own access; the API refuses it too.
  const isSelf = (member: StaffMember) => me?.kind === "staff" && me.id === member.id;

  const rowActions: RowAction<StaffMember>[] = [
    { id: "edit", permission: "staff:manage", label: "Edit", icon: Pencil, swipe: "leading", hidden: isSelf, run: (member) => setEditing(member) },
    { id: "access", permission: "staff:manage", label: "Custom permissions", icon: ShieldCheck, hidden: isSelf, run: (member) => setAccess(member) },
    {
      id: "deactivate",
      permission: "staff:manage",
      label: "Deactivate",
      icon: CircleSlash,
      hidden: (member) => !member.isActive || isSelf(member),
      confirm: (member) => ({ title: `Deactivate ${member.name}?`, description: "They are signed out on their next click and can't sign in again until you reactivate them.", confirmLabel: "Deactivate" }),
      optimistic: () => ({ isActive: false }),
      run: (member) => settle(updateStaffAction({ id: member.id, isActive: false }), `${member.name} deactivated`),
    },
    {
      id: "activate",
      permission: "staff:manage",
      label: "Reactivate",
      icon: CircleCheck,
      hidden: (member) => member.isActive || isSelf(member),
      optimistic: () => ({ isActive: true }),
      run: (member) => settle(updateStaffAction({ id: member.id, isActive: true }), `${member.name} can sign in again`),
    },
    {
      id: "delete",
      permission: "staff:manage",
      label: "Remove",
      icon: Trash2,
      tone: "destructive",
      swipe: "trailing",
      hidden: isSelf,
      confirm: (member) => ({ title: `Remove ${member.name}?`, description: "Their account is deleted. The audit log keeps a record of what they did.", confirmLabel: "Remove" }),
      optimistic: "remove",
      run: (member) => settle(deleteStaffAction({ id: member.id }), `${member.name} removed`),
    },
  ];

  return (
    <>
      <DataGrid<StaffMember>
        id="staff"
        noun={["staff member", "staff members"]}
        columns={staffColumns}
        source={source}
        getRowId={(member) => member.id}
        rowActions={rowActions}
        onMutated={() => router.refresh()}
        cells={{
          name: (member) => (
            <span className="font-medium">
              {member.name}
              {isSelf(member) && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
            </span>
          ),
          role: (member) => (member.role ? <Badge variant="secondary">{member.role.name}</Badge> : <span className="text-muted-foreground">No role</span>),
          overrides: (member) => (member.overrides.length ? <span>{member.overrides.length}</span> : <span className="text-muted-foreground">None</span>),
        }}
        emptyState={
          <Empty className="border py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserCog />
              </EmptyMedia>
              <EmptyTitle>No staff yet</EmptyTitle>
              <EmptyDescription>Give your team their own sign-in, limited to the parts of the store they work on.</EmptyDescription>
            </EmptyHeader>
            <Can I="staff:manage">
              <EmptyContent>
                <AddStaffButton roles={roles} />
              </EmptyContent>
            </Can>
          </Empty>
        }
      />
      <StaffDialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} roles={roles} staff={editing} />
      {access && <StaffAccessDialog key={access.id} staff={access} roles={roles} open onOpenChange={(open) => !open && setAccess(null)} />}
    </>
  );
}
