"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, MailCheck, Sparkles } from "lucide-react";
import { DEMO_CUSTOMER } from "@/lib/storefront/mock/customer-api";
import { EASE } from "../motion";
import { Spinner, StoreLink } from "../primitives";
import { useStoreHref, useStorefront } from "../store-context";
import { Field } from "./forms";

const MOCK = !process.env.NEXT_PUBLIC_STOREFRONT_API_URL;

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

  async function signIn(email: string, password: string) {
    setPending(true);
    setError("");
    try {
      setCustomer(await api.login({ email, password }));
      router.push(href(next));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign you in.");
      setPending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void signIn(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
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
      {MOCK && (
        <button type="button" onClick={() => signIn(DEMO_CUSTOMER.email, DEMO_CUSTOMER.password)} disabled={pending} className="mb-6 flex w-full items-center gap-3 rounded-(--sf-radius) border border-dashed border-(--sf-line) p-3.5 text-left text-sm transition-colors hover:border-(--sf-text)">
          <Sparkles className="size-4 shrink-0" />
          <span>
            <span className="block font-medium">Try the demo shopper account</span>
            <span className="text-(--sf-muted)">{DEMO_CUSTOMER.email} · {DEMO_CUSTOMER.password}</span>
          </span>
        </button>
      )}
      <form onSubmit={submit} className="space-y-5">
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" autoComplete="email" required className="sf-input" />
        </Field>
        <Field label="Password" htmlFor="password">
          <PasswordInput id="password" name="password" autoComplete="current-password" invalid={Boolean(error)} />
        </Field>
        <div className="flex justify-end">
          <StoreLink href="/account/forgot-password" className="text-sm text-(--sf-muted) underline-offset-4 hover:text-(--sf-text) hover:underline">
            Forgot your password?
          </StoreLink>
        </div>
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
          email: String(form.get("email") ?? ""),
          password,
          marketingOptIn: form.get("marketing") === "on",
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
            <input id="lastName" name="lastName" autoComplete="family-name" required className="sf-input" />
          </Field>
        </div>
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" autoComplete="email" required className="sf-input" />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" name="password" autoComplete="new-password" invalid={Boolean(errors.password)} />
          {!errors.password && <p className="mt-1.5 text-xs text-(--sf-muted)">At least 8 characters.</p>}
        </Field>
        <label className="flex items-start gap-2.5 text-sm text-(--sf-muted)">
          <input type="checkbox" name="marketing" defaultChecked className="mt-0.5 size-4 accent-(--sf-primary)" />
          Email me about new arrivals and exclusive offers. Unsubscribe anytime.
        </label>
        {errors.form && <p role="alert" className="text-sm text-(--sf-sale)">{errors.form}</p>}
        <button type="submit" disabled={pending} className="sf-btn sf-btn-primary sf-btn-block">
          {pending && <Spinner />} Create account
        </button>
      </form>
    </AuthCard>
  );
}

export function ForgotPasswordView() {
  const { api } = useStorefront();
  const [sentTo, setSentTo] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setPending(true);
    await api.requestPasswordReset(email).catch(() => undefined);
    setPending(false);
    setSentTo(email);
  }

  return (
    <AuthCard
      title={sentTo ? "Check your email" : "Reset your password"}
      text={sentTo ? `If an account exists for ${sentTo}, you'll receive a link to reset your password in the next few minutes.` : "Enter your email and we'll send you a link to reset it."}
      footer={
        <StoreLink href="/account/login" className="sf-link font-medium text-(--sf-text)">
          Back to sign in
        </StoreLink>
      }
    >
      {sentTo ? (
        <div className="flex justify-center">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: EASE }} className="flex size-16 items-center justify-center rounded-full bg-(--sf-surface)">
            <MailCheck className="size-7" />
          </motion.div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <Field label="Email" htmlFor="email">
            <input id="email" name="email" type="email" autoComplete="email" required className="sf-input" />
          </Field>
          <button type="submit" disabled={pending} className="sf-btn sf-btn-primary sf-btn-block">
            {pending && <Spinner />} Send reset link
          </button>
        </form>
      )}
    </AuthCard>
  );
}
