"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import type { StoreInfo } from "@/components/storefront/store-context";
import { StorefrontRoot } from "@/components/storefront/StorefrontRoot";
import { ThemeRenderer } from "@/components/storefront/ThemeRenderer";
import type { HomeData } from "@/lib/storefront/types";
import type { ThemeDocument } from "@/lib/theme-engine/types";
import { cn } from "@/lib/utils";
import { ScaledFrame } from "./ScaledFrame";

export type ThumbnailStore = Omit<StoreInfo, "settings" | "mode">;

/**
 * A live miniature of the real storefront (header, sections, footer), so what
 * merchants see in the admin is exactly what customers get. With `href`, an
 * overlay link opens the full store. The overlay is a sibling (never a
 * wrapper) because the storefront itself contains links.
 */
export function ThemeThumbnail({
  document,
  data,
  store,
  href,
  label,
  device = "desktop",
  className,
}: {
  document: ThemeDocument;
  data: HomeData;
  store: ThumbnailStore;
  href?: string;
  label?: string;
  device?: "desktop" | "mobile";
  className?: string;
}) {
  // Static miniature: no reveal animations, nothing waits to scroll into view.
  const settings = { ...document.settings, animations: false };
  return (
    <div
      className={cn("group/thumb relative w-full overflow-hidden", device === "desktop" ? "aspect-16/10" : "aspect-9/19", className)}
      style={{ background: String(document.settings.colorBackground) }}
    >
      <ScaledFrame width={device === "desktop" ? 1280 : 390}>
        <StorefrontRoot store={{ ...store, mode: "design", settings }}>
          <ThemeRenderer document={document} data={data} />
        </StorefrontRoot>
      </ScaledFrame>
      {href && (
        <Link
          href={href}
          target="_blank"
          aria-label={label ?? "Open preview"}
          className="absolute inset-0 flex items-center justify-center bg-foreground/0 outline-none transition-colors duration-200 hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <span className="inline-flex translate-y-1 items-center gap-1.5 rounded-sm bg-background px-2.5 py-1 text-xs font-medium opacity-0 shadow-sm ring-1 ring-foreground/10 transition-[opacity,transform] duration-200 group-hover/thumb:translate-y-0 group-hover/thumb:opacity-100 group-focus-within/thumb:translate-y-0 group-focus-within/thumb:opacity-100">
            <Eye className="size-3.5" /> Preview
          </span>
        </Link>
      )}
    </div>
  );
}
