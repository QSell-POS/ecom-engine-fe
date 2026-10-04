export type CreateBrandPayload = {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  isActive?: boolean;
  /** A media asset id from /admin/media. null clears the logo. */
  logoId?: string | null;
};

export type UpdateBrandPayload = Partial<CreateBrandPayload>;
