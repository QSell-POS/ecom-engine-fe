"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// --- Media query ------------------------------------------------------------

export function useMediaQuery(query: string, serverFallback = true) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverFallback,
  );
}

// --- Persisted preferences (localStorage, SSR-safe, cross-tab) ----------------

const listeners = new Set<() => void>();

function read(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * JSON state persisted per key. Renders `fallback` on the server and first
 * client pass, then the saved value, so hydration never mismatches.
 * `fallback` must be referentially stable.
 */
export function usePersistedState<T extends object>(key: string, fallback: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );

  const value = useMemo<T>(() => {
    if (!raw) return fallback;
    try {
      return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const update = useCallback(
    (updater: (previous: T) => T) => {
      let previous = fallback;
      const stored = read(key);
      if (stored) {
        try {
          previous = { ...fallback, ...(JSON.parse(stored) as Partial<T>) };
        } catch {
          previous = fallback;
        }
      }
      try {
        window.localStorage.setItem(key, JSON.stringify(updater(previous)));
      } catch {
        // Storage unavailable (private mode): preferences just won't persist.
      }
      listeners.forEach((listener) => listener());
    },
    [key, fallback],
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    listeners.forEach((listener) => listener());
  }, [key]);

  return [value, update, reset] as const;
}
