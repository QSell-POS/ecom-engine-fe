import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { PreviewBar } from "@/components/storefront/PreviewBar";
import { StorefrontRoot } from "@/components/storefront/StorefrontRoot";
import { loadStore, toStoreInfo, type StoreParams } from "./store";

export async function generateMetadata({ params }: StoreParams): Promise<Metadata> {
  const { store } = await loadStore(params);
  const { name, tagline, favicon } = store.profile;
  return {
    title: { default: tagline ? `${name} · ${tagline}` : name, template: `%s · ${name}` },
    description: tagline,
    icons: favicon ? { icon: favicon } : undefined,
    // Previews and theme demos must never be indexed.
    robots: store.mode === "live" ? undefined : { index: false, follow: false },
  };
}

export default async function StoreLayout({ children, params }: StoreParams & { children: ReactNode }) {
  const { store } = await loadStore(params);
  const bar = store.mode === "demo" || store.mode === "preview";
  return (
    <div style={bar ? ({ "--sf-sticky-top": "48px" } as CSSProperties) : undefined}>
      {bar && <PreviewBar mode={store.mode as "demo" | "preview"} themeName={store.theme.name} themeId={store.theme.id} presetId={store.theme.presetId} />}
      <StorefrontRoot store={toStoreInfo(store)}>{children}</StorefrontRoot>
    </div>
  );
}
