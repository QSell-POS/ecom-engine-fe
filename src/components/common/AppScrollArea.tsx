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
    // A master–detail workspace ([data-workspace]) sizes itself to this area and
    // scrolls its own panes. The shell then stands down: if it could scroll too
    // (even by a pixel), wheel input chains into it mid-pane and its scrollbar
    // sits on top of the detail pane's, so dragging "sticks" half-way.
    <ScrollAreaPrimitive.Root data-slot="app-scroll-area" className="group/app relative min-h-0 flex-1">
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="app-scroll-viewport"
        // Radix wraps content in `display: table`, which lets wide content
        // (tables) widen the page instead of scrolling inside its own box.
        className="size-full outline-none [&>div]:block! has-data-workspace:overflow-hidden!"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar className="z-30 group-has-data-workspace/app:hidden" />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
