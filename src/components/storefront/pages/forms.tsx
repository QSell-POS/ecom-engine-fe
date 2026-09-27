"use client";

import type { ReactNode } from "react";
import type { AddressInput } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";

export const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France", "Netherlands", "India", "Nepal"];

export function Field({ label, htmlFor, error, className, children }: { label: string; htmlFor: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="sf-label">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-(--sf-sale)">{error}</p>}
    </div>
  );
}

export const EMPTY_ADDRESS: AddressInput = {
  firstName: "", lastName: "", company: "", line1: "", line2: "", city: "", region: "", postalCode: "", country: "United States", phone: "",
};

/** Address fields, read back with readAddress(new FormData(form), prefix). */
export function AddressFields({ prefix = "", defaults = EMPTY_ADDRESS, className }: { prefix?: string; defaults?: AddressInput; className?: string }) {
  const id = (name: string) => `${prefix}${name}`;
  return (
    <div className={cn("grid gap-4 @xl:grid-cols-2", className)}>
      <Field label="First name" htmlFor={id("firstName")}>
        <input id={id("firstName")} name={id("firstName")} required autoComplete="given-name" defaultValue={defaults.firstName} className="sf-input" />
      </Field>
      <Field label="Last name" htmlFor={id("lastName")}>
        <input id={id("lastName")} name={id("lastName")} required autoComplete="family-name" defaultValue={defaults.lastName} className="sf-input" />
      </Field>
      <Field label="Address" htmlFor={id("line1")} className="@xl:col-span-2">
        <input id={id("line1")} name={id("line1")} required autoComplete="address-line1" placeholder="Street and number" defaultValue={defaults.line1} className="sf-input" />
      </Field>
      <Field label="Apartment, suite, etc. (optional)" htmlFor={id("line2")} className="@xl:col-span-2">
        <input id={id("line2")} name={id("line2")} autoComplete="address-line2" defaultValue={defaults.line2} className="sf-input" />
      </Field>
      <Field label="City" htmlFor={id("city")}>
        <input id={id("city")} name={id("city")} required autoComplete="address-level2" defaultValue={defaults.city} className="sf-input" />
      </Field>
      <Field label="State / region" htmlFor={id("region")}>
        <input id={id("region")} name={id("region")} autoComplete="address-level1" defaultValue={defaults.region} className="sf-input" />
      </Field>
      <Field label="Postal code" htmlFor={id("postalCode")}>
        <input id={id("postalCode")} name={id("postalCode")} required autoComplete="postal-code" defaultValue={defaults.postalCode} className="sf-input" />
      </Field>
      <Field label="Country" htmlFor={id("country")}>
        <select id={id("country")} name={id("country")} autoComplete="country-name" defaultValue={defaults.country} className="sf-input">
          {COUNTRIES.map((country) => (
            <option key={country}>{country}</option>
          ))}
        </select>
      </Field>
      <Field label="Phone (for delivery updates)" htmlFor={id("phone")} className="@xl:col-span-2">
        <input id={id("phone")} name={id("phone")} type="tel" autoComplete="tel" defaultValue={defaults.phone} className="sf-input" />
      </Field>
      <input type="hidden" name={id("company")} defaultValue={defaults.company} />
    </div>
  );
}

export function readAddress(form: FormData, prefix = ""): AddressInput {
  const get = (name: keyof AddressInput) => String(form.get(`${prefix}${name}`) ?? "").trim();
  return {
    firstName: get("firstName"), lastName: get("lastName"), company: get("company"), line1: get("line1"), line2: get("line2"),
    city: get("city"), region: get("region"), postalCode: get("postalCode"), country: get("country"), phone: get("phone"),
  };
}

export function formatAddress(address: AddressInput) {
  return [
    `${address.firstName} ${address.lastName}`.trim(),
    address.company,
    [address.line1, address.line2].filter(Boolean).join(", "),
    [address.city, address.region, address.postalCode].filter(Boolean).join(", "),
    address.country,
  ].filter(Boolean);
}
