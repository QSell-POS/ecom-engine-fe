"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { TextField } from "@/components/common/FormFields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { createApiKeyAction } from "@/lib/api/api-key/action";
import { CreateApiKeySchema } from "@/lib/api/api-key/validation";

type Input = z.input<typeof CreateApiKeySchema>;
type Output = z.output<typeof CreateApiKeySchema>;

/**
 * The API returns the full key once, on creation. After this dialog closes it
 * is gone — hence the copy step before "Done".
 */
export function ApiKeyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(CreateApiKeySchema),
    defaultValues: { name: "", expiresAt: "" },
  });

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    if (!next) {
      form.reset();
      setServerError(null);
      setCreated(null);
      setCopied(false);
      router.refresh();
    }
    onOpenChange(next);
  }

  function onSubmit(values: Output) {
    setServerError(null);
    startTransition(async () => {
      const result = await createApiKeyAction(values);
      if (!result?.data) {
        setServerError(result?.serverError ?? "Please check the highlighted fields.");
        return;
      }
      const key = result.data.apiKey.key;
      if (key) {
        setCreated(key);
      } else {
        // Some deployments do not return the secret; nothing to show.
        toast.success("API key created");
        handleOpenChange(false);
      }
    });
  }

  async function copy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created);
      setCopied(true);
      toast.success("Key copied");
    } catch {
      toast.error("Could not copy. Select the key and copy it by hand.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle>Copy your key now</DialogTitle>
              <DialogDescription>This is the only time it is shown. Store it in your storefront env as API_KEY.</DialogDescription>
            </DialogHeader>
            <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3">
              <code className="min-w-0 flex-1 wrap-break-word font-mono text-[13px]">{created}</code>
              <Button variant="outline" size="sm" onClick={copy}>
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>New API key</DialogTitle>
              <DialogDescription>Storefronts use this key to read your catalog. One key per storefront keeps revoking simple.</DialogDescription>
            </DialogHeader>
            <form id="api-key-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <FieldGroup className="gap-4">
                <TextField form={form} name="name" label="Name" autoFocus placeholder="Web storefront" />
                <TextField form={form} name="expiresAt" label="Expires" optional type="date" description="Blank means it never expires." />
                {serverError && (
                  <Alert variant="destructive">
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                )}
              </FieldGroup>
            </form>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" form="api-key-form" disabled={isPending}>
                {isPending && <Spinner />}
                Create key
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CreateApiKeyButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> New key
      </Button>
      <ApiKeyDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
