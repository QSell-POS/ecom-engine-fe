import "server-only";
import { apiClient } from "@/lib/api/client";
import type { SeedCatalogPayload, SeedCatalogRemoval, SeedCatalogResult, SeedCatalogStatus } from "./types";

/** What a run would write, what exists, and how much of it is demo data. */
export async function getSeedStatus() {
  return apiClient<SeedCatalogStatus>("/admin/seed/catalog", { auth: "owner", revalidate: false });
}

/** Re-running is safe: rows are matched by slug/SKU and skipped if they exist. */
export async function seedCatalog(data: SeedCatalogPayload = {}) {
  return apiClient<SeedCatalogResult>("/admin/seed/catalog", { method: "POST", body: data, auth: "owner" });
}

/** Removes only rows carrying the seed markers; a merchant's own data is never touched. */
export async function removeSeededCatalog() {
  return apiClient<SeedCatalogRemoval>("/admin/seed/catalog", { method: "DELETE", auth: "owner" });
}
