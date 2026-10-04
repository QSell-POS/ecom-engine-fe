import type { Decimal } from "@/lib/api/shared/types";

export const DISCOUNT_TYPES = ["percentage", "fixed_amount"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

/**
 * `all_products` is the only value the API accepts. The three `specific_*`
 * values exist in the enum but have no targeting tables behind them, so
 * passing one is a 400 — only whole-order discounts work today.
 */
export const DISCOUNT_SCOPES = ["all_products"] as const;
export type DiscountScope = (typeof DISCOUNT_SCOPES)[number];

export type Discount = {
  id: string;
  name: string;
  /** 3–50 of A-Z 0-9 _ -, upper-cased on write and at checkout. */
  code: string;
  description?: string | null;
  type: DiscountType;
  /** Sent as a number, returned as a decimal string. */
  discountValue: Decimal | number;
  scope?: DiscountScope;
  /** Both are required on create. */
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
  maxTotalUses?: number | null;
  maxUsesPerCustomer?: number | null;
  /** The running redemption count. */
  timesUsed?: number;
  /** Stored but unused by the API. */
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type DiscountState = "active" | "scheduled" | "expired" | "exhausted" | "disabled";

/** What the merchant wants to know: is this code working right now? */
export function discountState(discount: Discount, now = Date.now()): DiscountState {
  if (discount.isActive === false) return "disabled";
  if (discount.maxTotalUses && (discount.timesUsed ?? 0) >= discount.maxTotalUses) return "exhausted";
  if (discount.startsAt && new Date(discount.startsAt).getTime() > now) return "scheduled";
  if (discount.endsAt && new Date(discount.endsAt).getTime() < now) return "expired";
  return "active";
}

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: "Percentage off",
  fixed_amount: "Fixed amount off",
};
