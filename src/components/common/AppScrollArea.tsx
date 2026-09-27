"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";
import { ScrollBar } from "@/components/ui/scroll-area";

/**
 * The admin's one vertical scroller. The window never scrolls; pages, tables
 * and lists grow with their content inside this area. Sticky elements (table
 * headers, form summaries) stick to its top edge.
 */
export function AppScrollArea({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const viewportRef = useRef<HTMLDivElement>(null);

  // A new page starts at the top (the window-level default no longer applies).
  useEffect(() => {
    viewportRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <ScrollAreaPrimitive.Root data-slot="app-scroll-area" className="relative min-h-0 flex-1">
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="app-scroll-viewport"
        // Radix wraps content in `display: table`, which lets wide content
        // (tables) widen the page instead of scrolling inside its own box.
        className="size-full outline-none [&>div]:block!"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar className="z-30" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
