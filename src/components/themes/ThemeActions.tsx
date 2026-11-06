"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, Eye, LayoutTemplate, MoreHorizontal, Palette, Rocket, Trash2 } from "lucide-react";
import { useCan } from "@/components/auth/PermissionsProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  deleteThemeAction,
  duplicateThemeAction,
  installThemeAction,
  publishThemeAction,
  switchTenantAction,
} from "@/lib/api/theme/action";
import { THEME_ROUTES } from "@/lib/api/theme/constants";

type Result = { serverError?: string; validationErrors?: unknown; data?: unknown } | undefined;

function useAction() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run<T extends Result>(
    action: () => Promise<T>,
    { success, error, onSuccess }: { success?: string | ((r: T) => string); error: string; onSuccess?: (r: T) => void },
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result?.data) {
        toast.error(error, { description: result?.serverError ?? "Please try again." });
        return;
      }
      if (success) toast.success(typeof success === "function" ? success(result) : success);
      if (onSuccess) onSuccess(result);
      else router.refresh();
    });
  }

  return { run, isPending, router };
}

function Confirm({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function StoreSwitcher({
  tenants,
  currentId,
}: {
  tenants: { id: string; name: string; plan: string }[];
  currentId: string;
}) {
  const { run, isPending } = useAction();
  return (
    <Select
      value={currentId}
      disabled={isPending}
      onValueChange={(tenantId) => run(() => switchTenantAction({ tenantId }), { error: "Couldn't switch store" })}
    >
      <SelectTrigger className="min-w-48" aria-label="Store">
        <SelectValue>{tenants.find((t) => t.id === currentId)?.name}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {tenants.map((tenant) => (
          <SelectItem key={tenant.id} value={tenant.id}>
            {tenant.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Actions for a theme the tenant owns. The live theme leads with the simple
 * customizer; the visual builder is the secondary, advanced path.
 */
export function ThemeActions({
  themeId,
  themeName,
  isLive,
  liveThemeName,
  atLimit,
  storeSlug,
}: {
  themeId: string;
  themeName: string;
  isLive: boolean;
  liveThemeName: string | null;
  atLimit: boolean;
  storeSlug: string;
}) {
  const { run, isPending } = useAction();
  const [confirm, setConfirm] = useState<"publish" | "delete" | null>(null);
  const canEdit = useCan("themes:edit");
  const canPublish = useCan("themes:publish");
  const canDelete = useCan("themes:delete");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isLive ? (
        <>
          <Button asChild>
            <Link href={THEME_ROUTES.customize}>
              <Palette /> Customize
            </Link>
          </Button>
          {canEdit && (
            <Button variant="outline" asChild>
              <Link href={THEME_ROUTES.editor(themeId)}>
                <LayoutTemplate /> Edit in builder
              </Link>
            </Button>
          )}
        </>
      ) : (
        <>
          {canPublish && (
            <Button variant="outline" disabled={isPending} onClick={() => setConfirm("publish")}>
              <Rocket /> Publish
            </Button>
          )}
          {canEdit && (
            <Button variant="ghost" asChild>
              <Link href={THEME_ROUTES.editor(themeId)}>Edit in builder</Link>
            </Button>
          )}
        </>
      )}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`More actions for ${themeName}`} disabled={isPending}>
            {isPending ? <Spinner /> : <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {isLive && (
            <DropdownMenuItem asChild>
              <Link href={THEME_ROUTES.storefront(storeSlug)} target="_blank">
                <Eye /> View store
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={THEME_ROUTES.preview(themeId)} target="_blank">
              <Eye /> {isLive ? "Preview unpublished changes" : "Preview on your store"}
            </Link>
          </DropdownMenuItem>
          {canEdit && (
          <DropdownMenuItem
            disabled={atLimit}
            onSelect={() =>
              run(() => duplicateThemeAction({ themeId }), {
                success: `Duplicated “${themeName}”`,
                error: "Couldn't duplicate theme",
              })
            }
          >
            <Copy /> Duplicate
          </DropdownMenuItem>
          )}
          {!isLive && canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("delete")}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Confirm
        open={confirm === "publish"}
        onOpenChange={(open) => setConfirm(open ? "publish" : null)}
        title={`Publish “${themeName}”?`}
        description={
          liveThemeName
            ? `Customers will see “${themeName}” instead of “${liveThemeName}”. You can switch back at any time.`
            : `Your storefront will go live with “${themeName}”.`
        }
        confirmLabel="Publish"
        onConfirm={() =>
          run(() => publishThemeAction({ themeId }), {
            success: `“${themeName}” is now live`,
            error: "Couldn't publish theme",
          })
        }
      />
      <Confirm
        open={confirm === "delete"}
        onOpenChange={(open) => setConfirm(open ? "delete" : null)}
        title={`Delete “${themeName}”?`}
        description="The theme and all its customizations will be permanently deleted. This can't be undone."
        confirmLabel="Delete theme"
        destructive
        onConfirm={() =>
          run(() => deleteThemeAction({ themeId }), { success: "Theme deleted", error: "Couldn't delete theme" })
        }
      />
    </div>
  );
}

/**
 * "Use this theme": installs the preset and makes it live in one step, then
 * opens the simple customizer. Confirms first when it replaces a live theme.
 */
export function InstallThemeButton({
  presetId,
  presetName,
  liveThemeName,
  atLimit,
  size = "default",
  className,
}: {
  presetId: string;
  presetName: string;
  liveThemeName: string | null;
  atLimit: boolean;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const { run, isPending, router } = useAction();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Installing a theme also makes it live.
  const canPublish = useCan("themes:publish");

  const install = () =>
    run(() => installThemeAction({ presetId }), {
      success: `${presetName} is now your live theme`,
      error: "Couldn't install the theme",
      onSuccess: () => router.push(`${THEME_ROUTES.customize}?welcome=1`),
    });

  if (!canPublish) return null;

  return (
    <>
      <Button
        size={size}
        className={className}
        disabled={atLimit || isPending}
        title={atLimit ? "You've reached your plan's theme limit. Delete a theme from your library first." : undefined}
        onClick={() => (liveThemeName ? setConfirmOpen(true) : install())}
      >
        {isPending && <Spinner />}
        Use this theme
      </Button>
      <Confirm
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Switch to ${presetName}?`}
        description={`${presetName} will replace “${liveThemeName}” on your storefront right away. Your logo, contact details and social links carry over, and “${liveThemeName}” stays in your library.`}
        confirmLabel={`Use ${presetName}`}
        onConfirm={install}
      />
    </>
  );
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={copied ? "Copied" : label}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
    </Button>
  );
}
