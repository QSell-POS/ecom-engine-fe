"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkStoreAddressAction, updateStoreAddressAction } from "@/lib/api/store-domain/action";
import type { StoreDomain } from "@/lib/api/store-domain/types";

type Status = { checking: boolean; available: boolean | null; message: string | null };

const IDLE: Status = { checking: false, available: null, message: null };

export function StoreAddressForm({ domain }: { domain: StoreDomain }) {
  const router = useRouter();
  const [value, setValue] = useState(domain.subdomain);
  const [status, setStatus] = useState<Status>(IDLE);
  const [isSaving, startSaving] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const previousAddresses = domain.previousAddresses ?? [];
  const dirty = value !== domain.subdomain;

  function onChange(next: string) {
    const normalized = next.trim().toLowerCase();
    setValue(normalized);
    clearTimeout(timer.current);
    if (normalized === domain.subdomain || normalized.length < 3) {
      setStatus(IDLE);
      return;
    }
    setStatus({ checking: true, available: null, message: null });
    timer.current = setTimeout(async () => {
      const result = await checkStoreAddressAction({ subdomain: normalized });
      if (!result?.data) {
        setStatus({ checking: false, available: null, message: result?.serverError ?? null });
        return;
      }
      setStatus({ checking: false, available: result.data.available, message: result.data.message ?? null });
    }, 400);
  }

  function onSave() {
    startSaving(async () => {
      const result = await updateStoreAddressAction({ subdomain: value });
      if (!result?.data) {
        toast.error(result?.serverError ?? "Could not change your store address.");
        return;
      }
      toast.success("Store address updated");
      setStatus(IDLE);
      router.refresh();
    });
  }

  return (
    <div className="max-w-xl space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="subdomain">Your store address</Label>
        <div className="flex items-center gap-2">
          <Input
            id="subdomain"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            className="font-mono"
          />
          <span className="shrink-0 text-sm text-muted-foreground">.{domain.rootDomain}</span>
        </div>
        {status.checking && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Checking availability…
          </p>
        )}
        {!status.checking && dirty && status.available === true && (
          <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-500">
            <Check className="size-3.5" /> Available
          </p>
        )}
        {!status.checking && status.available === false && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <X className="size-3.5" /> {status.message ?? "That address is not available."}
          </p>
        )}
      </div>

      <Alert>
        <AlertDescription>
          Renaming keeps <code className="font-mono">{domain.host}</code> working — it will redirect to your new
          address rather than break any links already out there.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={!dirty || status.available === false || status.checking || isSaving}>
          {isSaving && <Loader2 className="animate-spin" />}
          Save address
        </Button>
        {!dirty && (
          <Button variant="outline" asChild>
            <a href={`https://${domain.host}`} target="_blank" rel="noreferrer">
              Visit your store <ExternalLink className="size-3.5" />
            </a>
          </Button>
        )}
      </div>

      {previousAddresses.length > 0 && (
        <div className="space-y-2 border-t pt-5">
          <p className="text-sm font-medium">Previous addresses</p>
          <p className="text-sm text-muted-foreground">These still redirect to your store, so nothing that links to them breaks.</p>
          <ul className="space-y-1">
            {previousAddresses.map((previous) => (
              <li key={previous.host} className="font-mono text-sm text-muted-foreground">
                {previous.host}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
