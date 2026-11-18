import type { CustomerChannel, CustomerStatus } from "./types";

export type CreateCustomerPayload = {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  /** Omit for a walk-in who should have no login. */
  password?: string;
  status?: CustomerStatus;
  /** Where they came from; the API defaults to `manual`. */
  channel?: CustomerChannel;
};

export type UpdateCustomerStatusPayload = { status: CustomerStatus };
