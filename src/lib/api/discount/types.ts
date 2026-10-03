export const DISCOUNT_TYPES = ["percentage", "fixed_amount"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DISCOUNT_SCOPES = ["all_products", "specific_products", "specific_categories", "specific_brands"] as const;
export type DiscountScope = (typeof DISCOUNT_SCOPES)[number];

export type Discount = {
  id: string;
  name: string;
  /** Matched case-insensitively at checkout. */
  code: string;
  description?: string | null;
  type: DiscountType;
  /** Percent (0–100) for "percentage", money for "fixed_amount". */
  discountValue: number;
  scope: DiscountScope;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
  maxTotalUses?: number | null;
  maxUsesPerCustomer?: number | null;
  /** Redemption count, returned on the detail route. */
  totalUses?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type DiscountState = "active" | "scheduled" | "expired" | "exhausted" | "disabled";

/** What the merchant actually wants to know: is this code working right now? */
export function discountState(discount: Discount, now = Date.now()): DiscountState {
  if (discount.isActive === false) return "disabled";
  if (discount.maxTotalUses && (discount.totalUses ?? 0) >= discount.maxTotalUses) return "exhausted";
  if (discount.startsAt && new Date(discount.startsAt).getTime() > now) return "scheduled";
  if (discount.endsAt && new Date(discount.endsAt).getTime() < now) return "expired";
  return "active";
}

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: "Percentage off",
  fixed_amount: "Fixed amount off",
};

export const DISCOUNT_SCOPE_LABELS: Record<DiscountScope, string> = {
  all_products: "All products",
  specific_products: "Selected products",
  specific_categories: "Selected categories",
  specific_brands: "Selected brands",
};
