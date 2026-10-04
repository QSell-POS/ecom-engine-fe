"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { TextField } from "@/components/common/FormFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { loginAction, registerAction } from "@/lib/api/auth/action";
import { LoginSchema, RegisterSchema } from "@/lib/api/auth/validation";
import { AUTH_ROUTES } from "@/lib/api/auth/constants";

/**
 * Tenant sign-in. The API returns `accessToken`, which the server action puts
 * in an httpOnly cookie — the token never touches client state.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({ resolver: zodResolver(LoginSchema), defaultValues: { email: "", password: "" } });

  function onSubmit(values: { email: string; password: string }) {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (!result?.data) {
        setServerError(result?.serverError ?? "Check your email and password.");
        return;
      }
      toast.success(`Welcome back, ${result.data.tenant.name}`);
      // The proxy also guards this, so an invalid `next` just lands on the dashboard.
      const next = searchParams.get("next");
      router.replace(next?.startsWith("/") ? next : AUTH_ROUTES.afterLogin);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FieldGroup className="gap-4">
        <TextField form={form} name="email" label="Email" type="email" autoComplete="email" autoFocus placeholder="you@store.com" />
        <TextField form={form} name="password" label="Password" type="password" autoComplete="current-password" />
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
      </FieldGroup>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Spinner />}
        Sign in
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        No store yet?{" "}
        <Link href={AUTH_ROUTES.register} className="font-medium text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  function onSubmit(values: { name: string; email: string; password: string }) {
    setServerError(null);
    startTransition(async () => {
      const result = await registerAction(values);
      if (!result?.data) {
        setServerError(result?.serverError ?? "Please check the highlighted fields.");
        return;
      }
      toast.success("Store created", { description: "Next: add your first products." });
      router.replace(AUTH_ROUTES.afterLogin);
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FieldGroup className="gap-4">
        <TextField form={form} name="name" label="Store name" autoFocus placeholder="Northwind Goods" />
        <TextField form={form} name="email" label="Email" type="email" autoComplete="email" placeholder="you@store.com" />
        <TextField
          form={form}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          description="At least 8 characters."
        />
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
      </FieldGroup>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Spinner />}
        Create store
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have a store?{" "}
        <Link href={AUTH_ROUTES.login} className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
