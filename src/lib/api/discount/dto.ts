import type { DiscountScope, DiscountType } from "./types";

export type CreateDiscountPayload = {
  name: string;
  code: string;
  type: DiscountType;
  /** Number on the way in: 0.01–99999999, at most 2 decimals. */
  discountValue: number;
  /** Optional, and only "all_products" is accepted. */
  scope?: DiscountScope;
  /** Required ISO timestamps. */
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
  maxTotalUses?: number;
  maxUsesPerCustomer?: number;
  description?: string;
};

/**
 * `code`, `type`, `discountValue` and `scope` are immutable — sending any of
 * them is a 400. Issue a new code to change the money.
 */
export type UpdateDiscountPayload = {
  name?: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
  maxTotalUses?: number;
  maxUsesPerCustomer?: number;
};
