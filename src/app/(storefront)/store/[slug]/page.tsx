import { ThemeRenderer } from "@/components/storefront/ThemeRenderer";
import { loadStore, type StoreParams } from "./store";

// Home page: the theme's sections over the store's catalog. Customers see
// the published live theme; a signed-in merchant previewing sees the draft.
export default async function StoreHomePage({ params }: StoreParams) {
  const { store, catalog } = await loadStore(params);
  const data = await catalog.home();
  return <ThemeRenderer document={store.document} data={data} />;
}
