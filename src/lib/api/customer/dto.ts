import type { CustomerStatus } from "./types";

export type CreateCustomerPayload = {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  /** Omit for a walk-in who should have no login. */
  password?: string;
  status?: CustomerStatus;
};

export type UpdateCustomerStatusPayload = { status: CustomerStatus };
