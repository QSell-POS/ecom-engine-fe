export type CreateApiKeyPayload = {
  name: string;
  expiresAt?: string;
};

export type UpdateApiKeyPayload = Partial<CreateApiKeyPayload> & {
  isActive?: boolean;
};
