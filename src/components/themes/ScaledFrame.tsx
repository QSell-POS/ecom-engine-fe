"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Renders children at a fixed "device" width and scales them to exactly fill
// the container's width. The container's aspect ratio is set by the caller,
// so nothing shifts while measuring; content fades in once scaled.
export function ScaledFrame({ width = 1280, children }: { width?: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width));
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div
        inert
        aria-hidden
        className="pointer-events-none origin-top-left transition-opacity duration-200 select-none"
        style={{ width, transform: `scale(${scale ?? 0.25})`, opacity: scale ? 1 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}
