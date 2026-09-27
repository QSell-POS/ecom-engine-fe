"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { HomeData } from "@/lib/storefront/types";
import type { ThemeDocument } from "@/lib/theme-engine/types";
import { THEME_ROUTES } from "@/lib/api/theme/constants";
import { cn } from "@/lib/utils";
import { ThemeThumbnail, type ThumbnailStore } from "./ThemeThumbnail";

export type ThemeStoreItem = {
  id: string;
  name: string;
  tagline: string;
  industries: string[];
  style: string[];
  palette: string[];
  status: "live" | "installed" | null;
  preview: { document: ThemeDocument; data: HomeData; store: ThumbnailStore };
};

/** Marketplace grid: large live previews, filterable by industry. */
export function ThemeStoreGrid({ items }: { items: ThemeStoreItem[] }) {
  const industries = ["All", ...new Set(items.flatMap((item) => item.industries.slice(0, 1)))];
  const [filter, setFilter] = useState("All");
  const visible = filter === "All" ? items : items.filter((item) => item.industries.includes(filter));

  return (
    <div className="space-y-8">
      <div role="tablist" aria-label="Filter by industry" className="flex flex-wrap gap-2">
        {industries.map((industry) => (
          <button
            key={industry}
            type="button"
            role="tab"
            aria-selected={filter === industry}
            onClick={() => setFilter(industry)}
            className={cn(
              "rounded-sm border px-3.5 py-1.5 text-sm transition-colors",
              filter === industry ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {industry}
          </button>
        ))}
      </div>

      <motion.div layout className="grid gap-x-8 gap-y-12 lg:grid-cols-2">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.map((item) => (
            <motion.article
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="group"
            >
              <div className="relative rounded-md bg-muted/60 p-5 pb-8 transition-colors duration-300 group-hover:bg-muted sm:p-7 sm:pb-10">
                <div className="overflow-hidden rounded-sm shadow-[0_1px_2px_rgb(0_0_0/0.06),0_12px_32px_-12px_rgb(0_0_0/0.25)] ring-1 ring-foreground/5 transition-transform duration-500 ease-out group-hover:-translate-y-1">
                  <ThemeThumbnail {...item.preview} />
                </div>
                <div className="absolute right-3 -bottom-3 w-[22%] overflow-hidden rounded-[10px] border-4 border-foreground bg-foreground shadow-xl transition-transform duration-500 ease-out group-hover:-translate-y-2 sm:right-5">
                  <ThemeThumbnail {...item.preview} device="mobile" className="rounded-[6px]" />
                </div>
                {/* A sibling overlay, not a wrapper: the previews contain store links, and links can't nest. */}
                <Link
                  href={THEME_ROUTES.storeTheme(item.id)}
                  aria-label={`${item.name} theme details`}
                  className="absolute inset-0 z-10 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
                />
              </div>
              <div className="mt-6 flex items-start justify-between gap-4 pr-[26%]">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Link href={THEME_ROUTES.storeTheme(item.id)} className="text-lg font-semibold tracking-tight hover:underline hover:underline-offset-4">
                      {item.name}
                    </Link>
                    {item.status && (
                      <span className={cn("rounded-sm px-1.5 py-0.5 text-[11px] font-medium", item.status === "live" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                        {item.status === "live" ? "Live" : "Installed"}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.tagline}</p>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="flex -space-x-1">
                      {item.palette.map((color, i) => (
                        <span key={i} className="size-4 rounded-full ring-2 ring-background" style={{ background: color }} />
                      ))}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.style.join(" · ")}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 pt-1 text-sm font-medium">
                  <span className="text-muted-foreground">Free</span>
                </div>
              </div>
              <Link
                href={THEME_ROUTES.demo(item.id)}
                target="_blank"
                className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                View demo store <ArrowUpRight className="size-3.5" />
              </Link>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
