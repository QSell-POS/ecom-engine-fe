"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { SettingValues } from "@/lib/theme-engine/types";
import { cn } from "@/lib/utils";
import { EASE, useMotionEnabled } from "./motion";
import { themeCssVars } from "./theme-vars";

// The storefront's root element. Overlays (drawers, search) portal into it so
// they inherit the theme's CSS variables, fonts and container size, which is
// also what keeps them inside the builder's device frame.

const PortalContext = createContext<HTMLElement | null>(null);

export function StoreFrame({ settings, className, children }: { settings: SettingValues; className?: string; children: ReactNode }) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  return (
    <PortalContext.Provider value={element}>
      <div ref={setElement} className={cn("sf-root @container relative", className)} style={themeCssVars(settings)}>
        {children}
      </div>
    </PortalContext.Provider>
  );
}

export function SfDrawer({
  open,
  onOpenChange,
  side = "right",
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right" | "top";
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const container = useContext(PortalContext);
  const animate = useMotionEnabled();
  const offscreen = side === "top" ? { y: "-100%" } : { x: side === "right" ? "100%" : "-100%" };
  const onscreen = side === "top" ? { y: 0 } : { x: 0 };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount container={container}>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: animate ? 0.25 : 0 }}
              />
            </DialogPrimitive.Overlay>
            {/* Without a description, Radix expects aria-describedby to be explicitly unset. */}
            <DialogPrimitive.Content asChild forceMount {...(description ? {} : { "aria-describedby": undefined })}>
              <motion.div
                className={cn(
                  "fixed z-50 flex flex-col bg-(--sf-bg) text-(--sf-text) shadow-2xl outline-none",
                  side === "top" ? "inset-x-0 top-0 max-h-[85%]" : "inset-y-0 w-[min(28rem,100%)]",
                  side === "right" && "right-0",
                  side === "left" && "left-0",
                  className,
                )}
                initial={offscreen}
                animate={onscreen}
                exit={offscreen}
                transition={{ duration: animate ? 0.38 : 0, ease: EASE }}
              >
                <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-(--sf-line) px-5">
                  <DialogPrimitive.Title className="text-base font-medium">{title}</DialogPrimitive.Title>
                  <DialogPrimitive.Close className="sf-focus -mr-2 flex size-9 items-center justify-center rounded-full text-(--sf-muted) transition-colors hover:bg-(--sf-soft) hover:text-(--sf-text)" aria-label="Close">
                    <X className="size-5" />
                  </DialogPrimitive.Close>
                </div>
                {description && <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
                {footer && <div className="shrink-0 border-t border-(--sf-line) p-5">{footer}</div>}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
