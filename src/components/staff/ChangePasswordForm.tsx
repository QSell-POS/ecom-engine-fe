"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { TextField } from "@/components/common/FormFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { changePasswordAction } from "@/lib/api/rbac/action";
import { ChangePasswordSchema } from "@/lib/api/rbac/validation";

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof ChangePasswordSchema>, unknown, z.output<typeof ChangePasswordSchema>>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  return (
    <form
      noValidate
      className="max-w-md"
      onSubmit={form.handleSubmit((values) =>
        startTransition(async () => {
          setError(null);
          const result = await changePasswordAction(values);
          if (!result?.data) return setError(result?.serverError ?? "Couldn't change your password.");
          toast.success("Password changed");
          form.reset();
        }),
      )}
    >
      <FieldGroup className="gap-4">
        <TextField form={form} name="currentPassword" label="Current password" type="password" autoComplete="current-password" />
        <TextField form={form} name="newPassword" label="New password" type="password" autoComplete="new-password" description="At least 8 characters." />
        <TextField form={form} name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" />
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div>
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner />}
            Change password
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
