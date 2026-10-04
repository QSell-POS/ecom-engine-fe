export type LoginPayload = { email: string; password: string };

/** Only these three fields: the API rejects unknown properties outright. */
export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};
