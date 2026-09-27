import type { CSSProperties } from "react";
import { FONTS } from "@/lib/theme-engine/schema";
import type { SettingValues } from "@/lib/theme-engine/types";

/** Theme settings → CSS variables consumed by the .sf-* styles in globals.css. */
export function themeCssVars(settings: SettingValues): CSSProperties {
  const radius = Number(settings.radius ?? 6);
  const buttonRadius = settings.buttonShape === "pill" ? "999px" : settings.buttonShape === "sharp" ? "0px" : `${Math.min(radius, 10)}px`;
  return {
    "--sf-bg": settings.colorBackground,
    "--sf-surface": settings.colorSurface,
    "--sf-text": settings.colorText,
    "--sf-primary": settings.colorPrimary,
    "--sf-primary-text": settings.colorPrimaryText,
    "--sf-sale": settings.colorSale,
    "--sf-radius": `${radius}px`,
    "--sf-btn-radius": buttonRadius,
    "--sf-input-radius": settings.buttonShape === "sharp" ? "0px" : `${Math.min(radius, 8)}px`,
    "--sf-page-width": `${settings.pageWidth}px`,
    "--sf-heading-scale": Number(settings.headingScale ?? 100) / 100,
    "--sf-heading-case": settings.headingCase === "uppercase" ? "uppercase" : "none",
    "--sf-font-heading": (FONTS[String(settings.fontHeading)] ?? FONTS.inter).stack,
    "--sf-font-body": (FONTS[String(settings.fontBody)] ?? FONTS.inter).stack,
    "--sf-card-ratio": settings.cardImageRatio === "square" ? "1 / 1" : "4 / 5",
  } as CSSProperties;
}

export const schemeClass = (scheme: unknown) => `sf-scheme-${typeof scheme === "string" ? scheme : "default"}`;
export const spaceClass = (spacing: unknown) => `sf-space-${typeof spacing === "string" ? spacing : "medium"}`;
