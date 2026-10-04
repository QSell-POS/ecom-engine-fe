export type CreateDeliveryRatePayload = {
  region: string;
  /** null or omitted makes this the fallback for the whole region. */
  city?: string | null;
  shippingCost: number;
  isActive?: boolean;
};

export type UpdateDeliveryRatePayload = Partial<CreateDeliveryRatePayload>;
