/** `POST /admin/seed/catalog` — every field optional. */
export type SeedCatalogPayload = {
  brands?: number;
  categories?: number;
  products?: number;
  withImages?: boolean;
  /** Removes previously seeded rows first. */
  reset?: boolean;
};

export type SeedCatalogResult = {
  brands: { created: number; skipped: number };
  categories: { created: number; skipped: number };
  products: { created: number; skipped: number };
  images: { uploaded: number; failed: number };
};

/** `GET /admin/seed/catalog`: what a run would write, what exists, what is seeded. */
export type SeedCatalogStatus = {
  available: { brands: number; categories: number; products: number };
  total: { brands: number; categories: number; products: number };
  seeded: { brands: number; categories: number; products: number };
};

/** `DELETE /admin/seed/catalog`: rows removed, by table. */
export type SeedCatalogRemoval = { products: number; brands: number; categories: number; media: number };
