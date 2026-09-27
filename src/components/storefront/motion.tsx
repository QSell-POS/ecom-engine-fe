"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { useThemeSettings } from "./store-context";

// Motion for storefronts: short, soft and never in the way. Everything turns
// off when the theme disables animations or the visitor prefers reduced motion.

export const EASE = [0.22, 1, 0.36, 1] as const;

export function useMotionEnabled() {
  const reduced = useReducedMotion();
  const settings = useThemeSettings();
  return !reduced && settings.animations !== false;
}

type RevealProps = Omit<HTMLMotionProps<"div">, "children"> & { children: ReactNode; delay?: number; y?: number };

/** Fades and lifts content in the first time it scrolls into view. */
export function Reveal({ children, delay = 0, y = 18, className, ...props }: RevealProps) {
  const enabled = useMotionEnabled();
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Children reveal one after another (use with <RevealItem>). */
export function RevealGroup({ children, className, stagger = 0.07 }: { children: ReactNode; className?: string; stagger?: number }) {
  const enabled = useMotionEnabled();
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const enabled = useMotionEnabled();
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } }}
    >
      {children}
    </motion.div>
  );
}
