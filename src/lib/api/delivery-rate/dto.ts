export type CreateDeliveryRatePayload = {
  region: string;
  /** null or omitted makes this the fallback for the whole region. */
  city?: string | null;
  shippingCost: number;
  isActive?: boolean;
};

/** region and city cannot be moved — delete the rate and add another. */
export type UpdateDeliveryRatePayload = {
  shippingCost?: number;
  isActive?: boolean;
};
