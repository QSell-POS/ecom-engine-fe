"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SelectField, SwitchField, TextField } from "@/components/common/FormFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createStaffAction, updateStaffAction } from "@/lib/api/rbac/action";
import { CreateStaffSchema } from "@/lib/api/rbac/validation";
import type { Role, StaffMember } from "@/lib/api/rbac/types";

const EditSchema = z.object({
  name: z.string().trim().min(1, "Enter their name").max(120),
  roleId: z.string().min(1, "Choose a role"),
  isActive: z.boolean(),
  password: z.union([z.literal(""), z.string().min(8, "Use at least 8 characters").max(72)]),
});

function roleOptions(roles: Role[]) {
  return roles.map((role) => ({ value: role.id, label: role.builtIn ? role.name : `${role.name} (custom)` }));
}

function CreateForm({ roles, onDone }: { roles: Role[]; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof CreateStaffSchema>, unknown, z.output<typeof CreateStaffSchema>>({
    resolver: zodResolver(CreateStaffSchema),
    defaultValues: { name: "", email: "", password: "", roleId: "" },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add a staff member</DialogTitle>
        <DialogDescription>They sign in at the same login page with this email and password. Share the password with them yourself; they can change it under Your account.</DialogDescription>
      </DialogHeader>
      <form
        id="staff-form"
        noValidate
        onSubmit={form.handleSubmit((values) =>
          startTransition(async () => {
            setError(null);
            const result = await createStaffAction(values);
            if (!result?.data) return setError(result?.serverError ?? "Please check the highlighted fields.");
            toast.success(`${values.name} can now sign in`);
            onDone();
          }),
        )}
      >
        <FieldGroup className="gap-4">
          <TextField form={form} name="name" label="Name" autoFocus />
          <TextField form={form} name="email" label="Email" type="email" autoComplete="off" />
          <TextField form={form} name="password" label="Temporary password" type="text" autoComplete="new-password" description="At least 8 characters." />
          <SelectField form={form} name="roleId" label="Role" options={roleOptions(roles)} placeholder="Choose a role" />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" form="staff-form" disabled={isPending}>
          {isPending && <Spinner />}
          Add staff member
        </Button>
      </DialogFooter>
    </>
  );
}

function EditForm({ staff, roles, onDone }: { staff: StaffMember; roles: Role[]; onDone: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof EditSchema>, unknown, z.output<typeof EditSchema>>({
    resolver: zodResolver(EditSchema),
    defaultValues: { name: staff.name, roleId: staff.role?.id ?? "", isActive: staff.isActive, password: "" },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit {staff.name}</DialogTitle>
        <DialogDescription>{staff.email}</DialogDescription>
      </DialogHeader>
      <form
        id="staff-form"
        noValidate
        onSubmit={form.handleSubmit((values) =>
          startTransition(async () => {
            setError(null);
            const result = await updateStaffAction({ id: staff.id, ...values });
            if (!result?.data) return setError(result?.serverError ?? "Please check the highlighted fields.");
            toast.success("Changes saved");
            onDone();
          }),
        )}
      >
        <FieldGroup className="gap-4">
          <TextField form={form} name="name" label="Name" />
          <SelectField form={form} name="roleId" label="Role" options={roleOptions(roles)} />
          <SwitchField form={form} name="isActive" label="Can sign in" description="Turning this off signs them out on their next click." />
          <TextField form={form} name="password" label="New password" optional type="text" autoComplete="new-password" description="Leave blank to keep their current password." />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" form="staff-form" disabled={isPending}>
          {isPending && <Spinner />}
          Save
        </Button>
      </DialogFooter>
    </>
  );
}

/** Add a staff member, or edit one when `staff` is passed. */
export function StaffDialog({ open, onOpenChange, roles, staff }: { open: boolean; onOpenChange: (open: boolean) => void; roles: Role[]; staff?: StaffMember | null }) {
  const router = useRouter();
  const done = () => {
    onOpenChange(false);
    router.refresh();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {staff ? <EditForm key={staff.id} staff={staff} roles={roles} onDone={done} /> : <CreateForm roles={roles} onDone={done} />}
      </DialogContent>
    </Dialog>
  );
}

export function AddStaffButton({ roles }: { roles: Role[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus /> Add staff member
      </Button>
      <StaffDialog open={open} onOpenChange={setOpen} roles={roles} />
    </>
  );
}
