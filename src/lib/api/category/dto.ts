export type CreateCategoryPayload = {
  name: string;
  slug: string;
  image?: string;
  isActive?: boolean;
  description?: string;
};

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;
