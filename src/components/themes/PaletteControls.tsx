"use client";

import { useState } from "react";
import { Moon, Palette as PaletteIcon, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { contrastRatio, HEX, PALETTE_PRESETS, paletteMode, readableTextOn, type Palette, type PaletteMode } from "./palette";

const FIELDS: { key: keyof Palette; label: string; hint: string }[] = [
  { key: "colorBackground", label: "Background", hint: "The page behind everything." },
  { key: "colorSurface", label: "Cards & panels", hint: "Product cards, panels and alternate sections." },
  { key: "colorHeading", label: "Headings", hint: "Page and section titles." },
  { key: "colorText", label: "Body text", hint: "Paragraphs, prices and labels." },
  { key: "colorBorder", label: "Borders", hint: "Dividers, inputs and outlines." },
];

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
