import type { ShippingMethod, StoreProfile } from "./types";

// Price preview for cart and checkout. The backend recalculates totals when
// the order is placed (the order it returns is authoritative); this only lets
// the UI show accurate numbers before that.

export function shippingMethods(subtotal: number, config: StoreProfile["checkout"]): ShippingMethod[] {
  const free = subtotal >= config.freeShippingThreshold;
  return [
    { id: "standard", label: "Standard", description: "3–5 business days", price: free ? 0 : config.standardRate },
    { id: "express", label: "Express", description: "1–2 business days", price: config.expressRate },
  ];
}

export function orderTotals(subtotal: number, shipping: number, config: StoreProfile["checkout"]) {
  const tax = Math.round(subtotal * config.taxRate * 100) / 100;
  return { subtotal, shipping, tax, total: Math.round((subtotal + shipping + tax) * 100) / 100 };
}

export class StorefrontError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
