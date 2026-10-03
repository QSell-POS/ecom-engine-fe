export type CreateCategoryPayload = {
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  position?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
  /** A media asset id from /admin/media. null clears the image. */
  imageId?: string | null;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;
