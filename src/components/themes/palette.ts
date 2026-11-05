// Pure palette helpers, no React: safe to call from server components.

/** The page colors the simple customizer controls alongside the brand color. */
export type Palette = {
  colorBackground: string;
  colorSurface: string;
  colorText: string;
  colorHeading: string;
  colorBorder: string;
};

export type PaletteMode = "light" | "dark" | "custom";

/** Light and dark starting points; each pairs text with a background it reads well on. */
export const PALETTE_PRESETS: Record<Exclude<PaletteMode, "custom">, Palette> = {
  light: { colorBackground: "#ffffff", colorSurface: "#f4f4f5", colorText: "#3f3f46", colorHeading: "#18181b", colorBorder: "#e4e4e7" },
  dark: { colorBackground: "#0c0c0f", colorSurface: "#18181b", colorText: "#d4d4d8", colorHeading: "#fafafa", colorBorder: "#2e2e33" },
};

export const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function rgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 (none) to 21 (black on white). */
export function contrastRatio(a: string, b: string) {
  if (!HEX.test(a) || !HEX.test(b)) return 21;
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Black or white, whichever reads better on `hex`. */
export function readableTextOn(hex: string) {
  if (!HEX.test(hex)) return "#ffffff";
  return luminance(hex) > 0.45 ? "#111111" : "#ffffff";
}

export function paletteMode(palette: Palette): PaletteMode {
  for (const mode of ["light", "dark"] as const) {
    const preset = PALETTE_PRESETS[mode];
    if ((Object.keys(preset) as (keyof Palette)[]).every((key) => preset[key] === palette[key]?.toLowerCase())) return mode;
  }
  return "custom";
}

/** Fills gaps in a stored palette: missing heading follows text, missing border is derived. */
export function paletteFromSettings(settings: Record<string, unknown>): Palette {
  const str = (key: string, fallback: string) => (typeof settings[key] === "string" && HEX.test(settings[key] as string) ? (settings[key] as string) : fallback);
  const background = str("colorBackground", PALETTE_PRESETS.light.colorBackground);
  const text = str("colorText", PALETTE_PRESETS.light.colorText);
  const dark = luminance(background) < 0.2;
  return {
    colorBackground: background,
    colorSurface: str("colorSurface", PALETTE_PRESETS.light.colorSurface),
    colorText: text,
    colorHeading: str("colorHeading", text),
    colorBorder: str("colorBorder", dark ? PALETTE_PRESETS.dark.colorBorder : PALETTE_PRESETS.light.colorBorder),
  };
}
