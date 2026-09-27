"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowLeft, Eye, Paintbrush, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { installThemeAction } from "@/lib/api/theme/action";
import { THEME_ROUTES } from "@/lib/api/theme/constants";

// Admin-only chrome above a storefront preview. Deliberately quiet and in the
// admin's visual language so it's never mistaken for store content.

function UseThemeButton({ presetId, name }: { presetId: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await installThemeAction({ presetId });
          if (result?.data) {
            toast.success(`${name} is now your live theme`);
            router.push(`${THEME_ROUTES.customize}?welcome=1`);
          } else {
            toast.error(result?.serverError ?? "Couldn't install the theme. Please try again.");
          }
        })
      }
    >
      {pending && <Spinner />} Use this theme
    </Button>
  );
}

export function PreviewBar({
  mode,
  themeName,
  themeId,
  presetId,
}: {
  mode: "demo" | "preview";
  themeName: string;
  themeId: string | null;
  presetId: string | null;
}) {
  return (
    <div className="sticky top-0 z-60 flex h-12 items-center justify-between gap-3 border-b bg-background px-3 font-sans text-sm text-foreground shadow-sm sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={mode === "demo" && presetId ? THEME_ROUTES.storeTheme(presetId) : THEME_ROUTES.list}>
            <ArrowLeft /> <span className="hidden sm:inline">{mode === "demo" ? "Theme store" : "Themes"}</span>
          </Link>
        </Button>
        <p className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <Eye className="size-4 shrink-0" />
          <span className="truncate">
            {mode === "demo" ? (
              <>
                <span className="font-medium text-foreground">{themeName}</span> demo store
              </>
            ) : (
              <>
                Previewing <span className="font-medium text-foreground">{themeName}</span>
                <span className="hidden sm:inline"> · only you can see this</span>
              </>
            )}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {mode === "demo" && presetId && <UseThemeButton presetId={presetId} name={themeName} />}
        {mode === "preview" && themeId && (
          <>
            <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
              <Link href={THEME_ROUTES.editor(themeId)}>
                <Paintbrush /> Edit theme
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <a href={THEME_ROUTES.exitPreview}>
                <X /> Exit preview
              </a>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
