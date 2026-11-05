import type { MediaRef } from "@/lib/api/shared/types";

export type Brand = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  isActive?: boolean;
  /**
   * Reads return both: `logoId` is the asset id, `logo` the resolved object
   * (null when there is none). Writes send `logoId`.
   */
  logoId?: string | null;
  logo?: MediaRef | null;
  /** Active products; public reads only. */
  productsCount?: number;
  createdAt?: string;
  updatedAt?: string;
};
