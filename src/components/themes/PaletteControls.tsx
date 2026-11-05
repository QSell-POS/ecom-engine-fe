"use client";

import { useState } from "react";
import { Moon, Palette as PaletteIcon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

const FIELDS: { key: keyof Palette; label: string; hint: string }[] = [
  { key: "colorBackground", label: "Background", hint: "The page behind everything." },
  { key: "colorSurface", label: "Cards & panels", hint: "Product cards, panels and alternate sections." },
  { key: "colorHeading", label: "Headings", hint: "Page and section titles." },
  { key: "colorText", label: "Body text", hint: "Paragraphs, prices and labels." },
  { key: "colorBorder", label: "Borders", hint: "Dividers, inputs and outlines." },
];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

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

function ColorRow({ id, label, hint, value, onChange }: { id: string; label: string; hint: string; value: string; onChange: (value: string) => void }) {
  // Local text so a half-typed hex never reaches the preview.
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setText(value);
  }
  return (
    <div className="flex items-center gap-3">
      <label className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-foreground/10" style={{ background: value }}>
        <span className="sr-only">{label}</span>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
      </label>
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <Input
        id={id}
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          if (HEX.test(e.target.value.trim())) onChange(e.target.value.trim().toLowerCase());
        }}
        onBlur={() => setText(value)}
        className="w-28 font-mono uppercase"
      />
    </div>
  );
}

const MODES: { mode: PaletteMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Light", icon: Sun },
  { mode: "dark", label: "Dark", icon: Moon },
  { mode: "custom", label: "Custom", icon: PaletteIcon },
];

/**
 * Light / Dark / Custom presets plus a picker per page color. Choosing a
 * preset also swaps the brand color when it would vanish into the new
 * background (a near-black button on a dark page).
 */
export function PaletteControls({
  palette,
  primary,
  onChange,
}: {
  palette: Palette;
  primary: string;
  onChange: (patch: Partial<Palette> & { colorPrimary?: string; colorPrimaryText?: string }) => void;
}) {
  const current = paletteMode(palette);
  const [customOpen, setCustomOpen] = useState(current === "custom");
  const mode: PaletteMode = customOpen ? "custom" : current;

  function choose(next: PaletteMode) {
    if (next === "custom") {
      setCustomOpen(true);
      return;
    }
    setCustomOpen(false);
    const preset = PALETTE_PRESETS[next];
    const clash = contrastRatio(primary, preset.colorBackground) < 1.6;
    onChange(clash ? { ...preset, colorPrimary: preset.colorHeading, colorPrimaryText: readableTextOn(preset.colorHeading) } : preset);
  }

  const lowContrast = contrastRatio(palette.colorText, palette.colorBackground) < 4.5 || contrastRatio(palette.colorHeading, palette.colorBackground) < 3;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Color mode">
        {MODES.map(({ mode: option, label, icon: Icon }) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={mode === option}
            onClick={() => choose(option)}
            className={cn("flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors", mode === option ? "border-foreground ring-1 ring-foreground" : "hover:border-foreground/30")}
          >
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>

      {mode === "custom" && (
        <div className="space-y-3 rounded-md border p-3">
          {FIELDS.map((field) => (
            <ColorRow
              key={field.key}
              id={`palette-${field.key}`}
              label={field.label}
              hint={field.hint}
              value={palette[field.key]}
              onChange={(value) => onChange({ [field.key]: value })}
            />
          ))}
          {lowContrast && <p className="text-xs text-amber-600">Text may be hard to read on this background. Try a lighter or darker text color.</p>}
        </div>
      )}
    </div>
  );
}
