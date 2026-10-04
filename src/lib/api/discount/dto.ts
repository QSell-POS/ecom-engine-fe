import type { DiscountScope, DiscountType } from "./types";

export type CreateDiscountPayload = {
  name: string;
  code: string;
  type: DiscountType;
  discountValue: number;
  scope: DiscountScope;
  description?: string;
  /** ISO timestamps. */
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
  maxTotalUses?: number;
  maxUsesPerCustomer?: number;
};

export type UpdateDiscountPayload = Partial<CreateDiscountPayload>;
