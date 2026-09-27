import "server-only";
import { notFound } from "next/navigation";
import type { StoreInfo } from "@/components/storefront/store-context";
import { getStorefront } from "@/lib/api/theme/storefront";
import { getCatalogApi } from "@/lib/storefront/server";

// Shared by every storefront route: the resolved store (404 if it doesn't
// exist or has no live theme), its catalog API and client-side store info.

export type StoreParams = { params: Promise<{ slug: string }> };

export async function loadStore(params: StoreParams["params"]) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();
  return { store, catalog: getCatalogApi(store), basePath: `/store/${slug}` };
}

export function toStoreInfo(store: NonNullable<Awaited<ReturnType<typeof getStorefront>>>): StoreInfo {
  return {
    slug: store.slug,
    storeKey: store.storeKey,
    vertical: store.vertical,
    mode: store.mode,
    basePath: `/store/${store.slug}`,
    profile: store.profile,
    settings: store.document.settings,
  };
}
