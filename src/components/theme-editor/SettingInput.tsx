"use client";

import { useState } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { isSafeImageUrl, isSafeLinkUrl } from "@/lib/theme-engine/document";
import type { SettingField, SettingValue } from "@/lib/theme-engine/types";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function expandHex(value: string) {
  return value.length === 4 ? `#${[...value.slice(1)].map((c) => c + c).join("")}` : value;
}

function ColorInput({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  // Local text so a half-typed hex never reaches the document.
  const [text, setText] = useState(value);
  const [synced, setSynced] = useState(value);
  if (synced !== value) {
    setSynced(value);
    setText(value);
  }

  return (
    <div className="flex h-8 items-center gap-2 rounded-lg border border-input pr-1 pl-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <label className="relative size-6 shrink-0 cursor-pointer overflow-hidden rounded-md ring-1 ring-foreground/10" style={{ background: value }}>
        <span className="sr-only">Pick color</span>
        <input
          type="color"
          value={expandHex(value)}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <input
        id={id}
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          if (HEX.test(e.target.value)) onChange(e.target.value.toLowerCase());
        }}
        onBlur={() => setText(value)}
        className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase outline-none"
      />
    </div>
  );
}

export function SettingInput({
  field,
  value,
  onChange,
  idPrefix,
}: {
  field: SettingField;
  value: SettingValue | undefined;
  onChange: (value: SettingValue) => void;
  idPrefix: string;
}) {
  const id = `${idPrefix}-${field.id}`;
  const current = value ?? field.default;
  const info = field.info ? <FieldDescription className="text-xs">{field.info}</FieldDescription> : null;

  switch (field.type) {
    case "checkbox":
      return (
        <Field orientation="horizontal" className="justify-between">
          <FieldLabel htmlFor={id} className="font-normal">
            {field.label}
          </FieldLabel>
          <Switch id={id} checked={Boolean(current)} onCheckedChange={(checked) => onChange(checked)} />
        </Field>
      );

    case "range":
      return (
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor={id} className="font-normal">
              {field.label}
            </FieldLabel>
            <span className="text-sm text-muted-foreground tabular-nums">
              {String(current)}
              {field.unit}
            </span>
          </div>
          <Slider
            id={id}
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            value={[Number(current)]}
            onValueChange={([next]) => onChange(next)}
            aria-label={field.label}
            className="py-1.5"
          />
          {info}
        </Field>
      );

    case "select":
      return (
        <Field>
          <FieldLabel htmlFor={id} className="font-normal">
            {field.label}
          </FieldLabel>
          <Select value={String(current)} onValueChange={onChange}>
            <SelectTrigger id={id} className="w-full">
              <SelectValue>{field.options.find((o) => o.value === String(current))?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {info}
        </Field>
      );

    case "color":
      return (
        <Field>
          <FieldLabel htmlFor={id} className="font-normal">
            {field.label}
          </FieldLabel>
          <ColorInput id={id} value={String(current)} onChange={onChange} />
        </Field>
      );

    case "textarea":
      return (
        <Field>
          <FieldLabel htmlFor={id} className="font-normal">
            {field.label}
          </FieldLabel>
          <Textarea id={id} value={String(current)} onChange={(e) => onChange(e.target.value)} className="min-h-20" />
          {info}
        </Field>
      );

    case "url":
    case "image": {
      const text = String(current);
      const safe = field.type === "url" ? isSafeLinkUrl(text) : isSafeImageUrl(text);
      return (
        <Field data-invalid={!safe}>
          <FieldLabel htmlFor={id} className="font-normal">
            {field.label}
          </FieldLabel>
          <Input
            id={id}
            value={text}
            spellCheck={false}
            placeholder={field.type === "url" ? "/collections/all or https://…" : "https://…/image.jpg"}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!safe}
          />
          {!safe ? (
            <FieldError className="text-xs">
              {field.type === "url"
                ? "Use a link starting with https://, /, #, mailto: or tel:. Other links are removed when you save."
                : "Use an image link starting with https:// or /. Other links are removed when you save."}
            </FieldError>
          ) : (
            info
          )}
          {field.type === "image" && text && safe && (
            <div
              className="h-24 rounded-lg border bg-muted/40 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${JSON.stringify(text)})` }}
            />
          )}
        </Field>
      );
    }

    case "text":
      return (
        <Field>
          <FieldLabel htmlFor={id} className="font-normal">
            {field.label}
          </FieldLabel>
          <Input id={id} value={String(current)} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
          {info}
        </Field>
      );
  }
}
