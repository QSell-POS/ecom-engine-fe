"use client";

import { useState, type KeyboardEvent } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRODUCT_BADGES, productBadgeLabel, type ProductAttribute, type ProductBadge } from "@/lib/api/product/types";
import { cn } from "@/lib/utils";

/** Toggle chips, one per ProductBadge — nothing outside the enum can be entered. */
export function ProductBadgesField({ value, onChange }: { value: ProductBadge[]; onChange: (badges: ProductBadge[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Badges">
      {PRODUCT_BADGES.map((badge) => {
        const active = value.includes(badge);
        return (
          <button
            key={badge}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? value.filter((b) => b !== badge) : [...value, badge])}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            {active && <Check className="size-3.5" />}
            {productBadgeLabel(badge)}
          </button>
        );
      })}
    </div>
  );
}

/** Values as chips: Enter or comma adds one, Backspace on an empty input removes the last. */
function ValuesInput({ values, onChange, invalid }: { values: string[]; onChange: (values: string[]) => void; invalid?: boolean }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const additions = draft
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value && !values.includes(value));
    if (additions.length) onChange([...values, ...additions]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit();
    } else if (event.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-ring",
        invalid && "border-destructive",
      )}
    >
      {values.map((value) => (
        <span key={value} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm">
          {value}
          <button type="button" aria-label={`Remove ${value}`} className="text-muted-foreground hover:text-foreground" onClick={() => onChange(values.filter((v) => v !== value))}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={values.length ? "" : "Type a value, press Enter"}
        aria-label="Attribute values"
        className="min-w-24 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

/** Repeater for { name, values[] } pairs, e.g. Color → Black, White. */
export function ProductAttributesField({
  value,
  onChange,
  errors,
}: {
  value: ProductAttribute[];
  onChange: (attributes: ProductAttribute[]) => void;
  /** Per-row messages from the form, by index. */
  errors?: ({ name?: string; values?: string } | undefined)[];
}) {
  const update = (index: number, patch: Partial<ProductAttribute>) =>
    onChange(value.map((attribute, i) => (i === index ? { ...attribute, ...patch } : attribute)));

  return (
    <div className="space-y-3">
      {value.map((attribute, index) => {
        const error = errors?.[index];
        return (
          <div key={index} className="grid items-start gap-2 sm:grid-cols-[180px_minmax(0,1fr)_auto]">
            <div className="space-y-1">
              <Input
                value={attribute.name}
                onChange={(event) => update(index, { name: event.target.value })}
                placeholder="Name, e.g. Color"
                aria-label="Attribute name"
                aria-invalid={Boolean(error?.name)}
              />
              {error?.name && <p className="text-xs text-destructive">{error.name}</p>}
            </div>
            <div className="space-y-1">
              <ValuesInput values={attribute.values} onChange={(values) => update(index, { values })} invalid={Boolean(error?.values)} />
              {error?.values && <p className="text-xs text-destructive">{error.values}</p>}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove attribute"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <Trash2 />
            </Button>
          </div>
        );
      })}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { name: "", values: [] }])}>
        <Plus /> Add attribute
      </Button>
    </div>
  );
}
