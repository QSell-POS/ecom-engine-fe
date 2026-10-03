import type { MediaRef } from "@/lib/api/shared/types";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  parent?: Category | null;
  position?: number | null;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
  /**
   * Reads return both: `imageId` is the asset id, `image` the resolved object
   * (null when there is none). Writes send `imageId`.
   */
  imageId?: string | null;
  image?: MediaRef | null;
  createdAt?: string;
  updatedAt?: string;
};
