/** `GET /admin/store/domain`. */
export type StoreDomain = {
  subdomain: string;
  host: string;
  rootDomain: string;
  /** Old addresses that still 301 to `host` — a rename never frees them. */
  previousAddresses: { subdomain: string; host: string }[];
};

export type AvailabilityReason =
  | "required"
  | "too-short"
  | "too-long"
  | "invalid-characters"
  | "hyphen-edge"
  | "punycode-prefix"
  | "reserved"
  | "taken";

/** `GET /admin/store/domain/availability` and the unauthenticated sign-up check. */
export type SubdomainAvailability = {
  available: boolean;
  reason?: AvailabilityReason;
  /** Copy to show directly; `reason` is there only if the caller wants its own wording. */
  message?: string;
  rules: string;
  rootDomain: string;
};
