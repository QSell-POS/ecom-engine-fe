export type ApiKey = {
  id: string;
  name: string;
  key?: string;
  prefix: string;
  isActive?: boolean;
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
