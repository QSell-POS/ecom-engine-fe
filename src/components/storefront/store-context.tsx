"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { createCustomerApi } from "@/lib/storefront/client";
import type { CustomerApi } from "@/lib/storefront/contracts";
import type { Cart, Customer, Product, StoreMode, StoreProfile, Vertical, WishlistItem } from "@/lib/storefront/types";
import type { SettingValues } from "@/lib/theme-engine/types";

// Client-side storefront state: which store we're in, the shopper's cart,
// wishlist and account. All data goes through the CustomerApi contract, so
// this file doesn't change when the NestJS backend replaces the mock.

export type StoreInfo = {
  slug: string;
  storeKey: string;
  vertical: Vertical;
  mode: StoreMode;
  /** URL prefix for every store link, e.g. "/store/acme". */
  basePath: string;
  profile: StoreProfile;
  settings: SettingValues;
};

type StoreState = {
  store: StoreInfo;
  api: CustomerApi;
  cart: Cart | null;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, variantId: string, quantity?: number) => Promise<boolean>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  setCart: (cart: Cart) => void;
  wishlist: WishlistItem[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Pick<Product, "id" | "name">) => Promise<void>;
  /** undefined while loading. */
  customer: Customer | null | undefined;
  setCustomer: (customer: Customer | null) => void;
};

const StoreContext = createContext<StoreState | null>(null);

const message = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong. Please try again.");

export function StoreProvider({ store, children }: { store: StoreInfo; children: ReactNode }) {
  const { storeKey, vertical, mode } = store;
  const checkout = store.profile.checkout;
  const api = useMemo(() => createCustomerApi({ storeKey, vertical, checkout, mode }), [storeKey, vertical, checkout, mode]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getCart(), api.getWishlist(), api.getCustomer()])
      .then(([nextCart, nextWishlist, nextCustomer]) => {
        if (cancelled) return;
        setCart(nextCart);
        setWishlist(nextWishlist);
        setCustomer(nextCustomer);
      })
      .catch(() => {
        if (!cancelled) setCustomer(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const addToCart = useCallback(
    // `variantId` is kept in the signature so callers that pass a variant
    // (always equal to the product id — this catalog has no variants) don't
    // need to change; the contract itself only ever takes a product id.
    async (product: Product, _variantId: string, quantity = 1) => {
      try {
        setCart(await api.addToCart({ productId: product.id, quantity }));
        setCartOpen(true);
        return true;
      } catch (error) {
        toast.error(message(error));
        return false;
      }
    },
    [api],
  );

  const updateLine = useCallback(
    async (lineId: string, quantity: number) => {
      try {
        setCart(await api.updateCartLine(lineId, quantity));
      } catch (error) {
        toast.error(message(error));
      }
    },
    [api],
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      try {
        setCart(await api.removeCartLine(lineId));
      } catch (error) {
        toast.error(message(error));
      }
    },
    [api],
  );

  const isWishlisted = useCallback((productId: string) => wishlist.some((item) => item.productId === productId), [wishlist]);

  const toggleWishlist = useCallback(
    async (product: Pick<Product, "id" | "name">) => {
      const saved = wishlist.some((item) => item.productId === product.id);
      try {
        const next = await api.toggleWishlist(product.id);
        setWishlist(next);
        toast.success(saved ? `Removed ${product.name} from your wishlist` : `Saved ${product.name} to your wishlist`);
      } catch (error) {
        toast.error(message(error));
      }
    },
    [api, wishlist],
  );

  const value = useMemo<StoreState>(
    () => ({
      store,
      api,
      cart,
      cartOpen,
      setCartOpen,
      addToCart,
      updateLine,
      removeLine,
      setCart,
      wishlist,
      isWishlisted,
      toggleWishlist,
      customer,
      setCustomer,
    }),
    [store, api, cart, cartOpen, addToCart, updateLine, removeLine, wishlist, isWishlisted, toggleWishlist, customer],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStorefront() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStorefront must be used inside <StoreProvider>");
  return context;
}

/** Resolves a theme/store link ("/products") against the store's base path. */
export function resolveStoreHref(basePath: string, href: string) {
  if (!href || href === "#") return basePath || "/";
  if (href.startsWith("/")) return `${basePath}${href === "/" ? "" : href}` || "/";
  return href;
}

export function useStoreHref() {
  const context = useContext(StoreContext);
  const basePath = context?.store.basePath ?? "";
  return useCallback((href: string) => resolveStoreHref(basePath, href), [basePath]);
}

/** Theme settings for components that adapt to them (cards, motion). */
export function useThemeSettings(): SettingValues {
  return useContext(StoreContext)?.store.settings ?? {};
}
