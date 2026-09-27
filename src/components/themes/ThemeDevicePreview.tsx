"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Monitor, Smartphone } from "lucide-react";
import type { HomeData } from "@/lib/storefront/types";
import type { ThemeDocument } from "@/lib/theme-engine/types";
import { cn } from "@/lib/utils";
import { ThemeThumbnail, type ThumbnailStore } from "./ThemeThumbnail";

/** Theme preview in a browser or phone frame, with a device switch. */
export function ThemeDevicePreview({ document, data, store, href }: { document: ThemeDocument; data: HomeData; store: ThumbnailStore; href: string }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div role="radiogroup" aria-label="Preview device" className="inline-flex rounded-md border bg-card p-0.5">
          {(["desktop", "mobile"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={device === value}
              onClick={() => setDevice(value)}
              className={cn("flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors", device === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
            >
              {value === "desktop" ? <Monitor className="size-4" /> : <Smartphone className="size-4" />}
              {value === "desktop" ? "Desktop" : "Mobile"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-[26rem] items-start justify-center rounded-md bg-muted/60 p-4 sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          {device === "desktop" ? (
            <motion.div key="desktop" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="w-full overflow-hidden rounded-md bg-background shadow-[0_20px_50px_-20px_rgb(0_0_0/0.35)] ring-1 ring-foreground/10">
              <div className="flex h-8 items-center gap-1.5 border-b bg-muted/50 px-3">
                <span className="size-2.5 rounded-full bg-foreground/15" />
                <span className="size-2.5 rounded-full bg-foreground/15" />
                <span className="size-2.5 rounded-full bg-foreground/15" />
                <span className="mx-auto truncate rounded-sm bg-background px-10 py-0.5 text-[11px] text-muted-foreground">{store.profile.name.toLowerCase().replace(/\s+/g, "")}.com</span>
              </div>
              <ThemeThumbnail document={document} data={data} store={store} href={href} label="Open the full demo store" />
            </motion.div>
          ) : (
            <motion.div key="mobile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="w-[min(18rem,80%)] overflow-hidden rounded-[2rem] border-[10px] border-foreground bg-foreground shadow-[0_20px_50px_-20px_rgb(0_0_0/0.45)]">
              <ThemeThumbnail document={document} data={data} store={store} device="mobile" href={href} label="Open the full demo store" className="rounded-[1.4rem]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
