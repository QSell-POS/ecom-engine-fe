export type CreateBrandPayload = {
  name: string;
  slug: string;
  logo?: string;
  website?: string;
  isActive?: boolean;
  description?: string;
};

export type UpdateBrandPayload = Partial<CreateBrandPayload>;
