"use client";

import type { ReactNode } from "react";
import type { AddressInput } from "@/lib/storefront/types";
import { cn } from "@/lib/utils";

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

export const EMPTY_ADDRESS: AddressInput = { region: "", city: "", area: "", buildingStreet: "", address: "", landmark: "", postalCode: "", phone: "", label: "HOME" };

/** Address fields, read back with readAddress(new FormData(form), prefix). */
export function AddressFields({ prefix = "", defaults = EMPTY_ADDRESS, className }: { prefix?: string; defaults?: AddressInput; className?: string }) {
  const id = (name: string) => `${prefix}${name}`;
  return (
    <div className={cn("grid gap-4 @xl:grid-cols-2", className)}>
      <Field label="Region" htmlFor={id("region")}>
        <input id={id("region")} name={id("region")} required placeholder="Bagmati" defaultValue={defaults.region} className="sf-input" />
      </Field>
      <Field label="City" htmlFor={id("city")}>
        <input id={id("city")} name={id("city")} required placeholder="Kathmandu" defaultValue={defaults.city} className="sf-input" />
      </Field>
      <Field label="Area" htmlFor={id("area")}>
        <input id={id("area")} name={id("area")} required placeholder="Baneshwor" defaultValue={defaults.area} className="sf-input" />
      </Field>
      <Field label="House / street" htmlFor={id("buildingStreet")}>
        <input id={id("buildingStreet")} name={id("buildingStreet")} required placeholder="House 42" defaultValue={defaults.buildingStreet} className="sf-input" />
      </Field>
      <Field label="Full address" htmlFor={id("address")} className="@xl:col-span-2">
        <input id={id("address")} name={id("address")} required placeholder="House 42, Mid-Baneshwor, Kathmandu" defaultValue={defaults.address} className="sf-input" />
      </Field>
      <Field label="Landmark (optional)" htmlFor={id("landmark")}>
        <input id={id("landmark")} name={id("landmark")} placeholder="Near City Centre" defaultValue={defaults.landmark} className="sf-input" />
      </Field>
      <Field label="Postal code (optional)" htmlFor={id("postalCode")}>
        <input id={id("postalCode")} name={id("postalCode")} defaultValue={defaults.postalCode} className="sf-input" />
      </Field>
      <Field label="Phone (for delivery updates)" htmlFor={id("phone")} className="@xl:col-span-2">
        <input id={id("phone")} name={id("phone")} type="tel" defaultValue={defaults.phone} className="sf-input" />
      </Field>
      <Field label="Label" htmlFor={id("label")}>
        <select id={id("label")} name={id("label")} defaultValue={defaults.label} className="sf-input">
          <option value="HOME">Home</option>
          <option value="OFFICE">Office</option>
          <option value="OTHER">Other</option>
        </select>
      </Field>
    </div>
  );
}

export function readAddress(form: FormData, prefix = ""): AddressInput {
  const get = (name: keyof AddressInput) => String(form.get(`${prefix}${name}`) ?? "").trim();
  return {
    region: get("region"),
    city: get("city"),
    area: get("area"),
    buildingStreet: get("buildingStreet"),
    address: get("address"),
    landmark: get("landmark"),
    postalCode: get("postalCode"),
    phone: get("phone"),
    label: (get("label") as AddressInput["label"]) || "HOME",
  };
}

export function formatAddress(address: AddressInput) {
  return [address.address, [address.area, address.city, address.region].filter(Boolean).join(", "), address.landmark].filter(Boolean);
}
