import type { MediaRef } from "@/lib/api/shared/types";

export type Brand = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  website?: string | null;
  isActive?: boolean;
  /** Read shape. Writes send `logoId` (a media asset id) instead. */
  logo?: MediaRef | null;
  createdAt?: string;
  updatedAt?: string;
};
