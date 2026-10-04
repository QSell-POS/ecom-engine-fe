"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { EASE } from "../motion";
import { Spinner, StoreLink } from "../primitives";
import { useStoreHref, useStorefront } from "../store-context";
import { Field } from "./forms";

function AuthCard({ title, text, children, footer }: { title: string; text: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="sf-container flex justify-center py-12 @5xl:py-20">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="w-full max-w-md">
        <h1 className="sf-heading sf-h2 text-center">{title}</h1>
        <p className="mt-2 text-center text-(--sf-muted)">{text}</p>
        <div className="mt-10">{children}</div>
        <div className="mt-8 border-t border-(--sf-line) pt-6 text-center text-sm text-(--sf-muted)">{footer}</div>
      </motion.div>
    </div>
  );
}

function PasswordInput({ id, name, autoComplete, invalid }: { id: string; name: string; autoComplete: string; invalid?: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required aria-invalid={invalid} className="sf-input pr-11!" />
      <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"} className="sf-focus absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-(--sf-muted) hover:text-(--sf-text)">
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/** Where to go after signing in: ?next= (store-relative, same store only) or the account page. */
function useNext() {
  const params = useSearchParams();
  const next = params.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export function LoginView() {
  const { api, setCustomer } = useStorefront();
  const router = useRouter();
  const href = useStoreHref();
  const next = useNext();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const identifier = String(form.get("identifier") ?? "");
    const password = String(form.get("password") ?? "");
    setPending(true);
    setError("");
    (async () => {
      try {
        const customer = await api.login({ identifier, password });
        if (!customer) {
          setError("That email/phone or password isn't right.");
          setPending(false);
          return;
        }
        setCustomer(customer);
        router.push(href(next));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't sign you in.");
        setPending(false);
      }
    })();
  }

  return (
    <AuthCard
      title="Welcome back"
      text="Sign in to track orders, save addresses and check out faster."
      footer={
        <>
          New here? <StoreLink href={`/account/register${next !== "/account" ? `?next=${encodeURIComponent(next)}` : ""}`} className="sf-link font-medium text-(--sf-text)">Create an account</StoreLink>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="Email or phone" htmlFor="identifier">
          <input id="identifier" name="identifier" autoComplete="username" required className="sf-input" />
        </Field>
        <Field label="Password" htmlFor="password">
          <PasswordInput id="password" name="password" autoComplete="current-password" invalid={Boolean(error)} />
        </Field>
        {error && <p role="alert" className="text-sm text-(--sf-sale)">{error}</p>}
        <button type="submit" disabled={pending} className="sf-btn sf-btn-primary sf-btn-block">
          {pending && <Spinner />} Sign in
        </button>
      </form>
    </AuthCard>
  );
}

export function RegisterView() {
  const { api, setCustomer } = useStorefront();
  const router = useRouter();
  const href = useStoreHref();
  const next = useNext();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password.length < 8) {
      setErrors({ password: "Use at least 8 characters." });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      setCustomer(
        await api.register({
          firstName: String(form.get("firstName") ?? ""),
          lastName: String(form.get("lastName") ?? ""),
          phone: String(form.get("phone") ?? "") || undefined,
          email: String(form.get("email") ?? ""),
          password,
        }),
      );
      router.push(href(next));
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : "Couldn't create your account." });
      setPending(false);
    }
  }

  return (
    <AuthCard
      title="Create an account"
      text="Faster checkout, order tracking and a wishlist on every device."
      footer={
        <>
          Already have an account? <StoreLink href="/account/login" className="sf-link font-medium text-(--sf-text)">Sign in</StoreLink>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" htmlFor="firstName">
            <input id="firstName" name="firstName" autoComplete="given-name" required className="sf-input" />
          </Field>
          <Field label="Last name" htmlFor="lastName">
            <input id="lastName" name="lastName" autoComplete="family-name" className="sf-input" />
          </Field>
        </div>
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" autoComplete="email" required className="sf-input" />
        </Field>
        <Field label="Phone (optional)" htmlFor="phone">
          <input id="phone" name="phone" type="tel" autoComplete="tel" className="sf-input" />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" name="password" autoComplete="new-password" invalid={Boolean(errors.password)} />
          {!errors.password && <p className="mt-1.5 text-xs text-(--sf-muted)">At least 8 characters.</p>}
        </Field>
        {errors.form && <p role="alert" className="text-sm text-(--sf-sale)">{errors.form}</p>}
        <button type="submit" disabled={pending} className="sf-btn sf-btn-primary sf-btn-block">
          {pending && <Spinner />} Create account
        </button>
      </form>
    </AuthCard>
  );
}
