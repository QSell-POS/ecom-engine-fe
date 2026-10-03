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
  /** Read shape. Writes send `imageId` (a media asset id) instead. */
  image?: MediaRef | null;
  createdAt?: string;
  updatedAt?: string;
};
