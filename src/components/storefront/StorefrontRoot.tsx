"use client";

import type { ReactNode } from "react";
import { StoreFrame } from "./overlay";
import { StoreChrome } from "./shell";
import { StoreProvider, type StoreInfo } from "./store-context";

/** A complete storefront: theme variables, shopper state and chrome around a page. */
export function StorefrontRoot({ store, children, className }: { store: StoreInfo; children: ReactNode; className?: string }) {
  return (
    <StoreProvider store={store}>
      <StoreFrame settings={store.settings} className={className}>
        <StoreChrome>{children}</StoreChrome>
      </StoreFrame>
    </StoreProvider>
  );
}
