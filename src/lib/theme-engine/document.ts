import { z } from "zod";
import { getBlockSchema, getSectionSchema, THEME_SETTINGS_SCHEMA } from "./schema";
import type {
  BlockInstance,
  SectionInstance,
  SettingField,
  SettingValue,
  SettingValues,
  ThemeDocument,
} from "./types";

export const MAX_SECTIONS = 40;

export function newId(prefix: string) {
  // randomUUID is unavailable on insecure origins (e.g. dev server opened via LAN IP).
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replaceAll("-", "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${random}`;
}

export function defaultValues(fields: SettingField[]): SettingValues {
  return Object.fromEntries(fields.map((field) => [field.id, field.default]));
}

export function createBlock(sectionType: string, blockType: string): BlockInstance {
  const schema = getBlockSchema(sectionType, blockType);
  if (!schema) throw new Error(`Unknown block "${blockType}" for section "${sectionType}"`);
  return { id: newId("blk"), type: blockType, settings: defaultValues(schema.settings) };
}

export function createSection(type: string): SectionInstance {
  const schema = getSectionSchema(type);
  if (!schema) throw new Error(`Unknown section type "${type}"`);
  return {
    id: newId("sec"),
    type,
    settings: defaultValues(schema.settings),
    blocks: (schema.defaultBlocks ?? []).map((blockType) => createBlock(type, blockType)),
  };
}

export function cloneSection(section: SectionInstance): SectionInstance {
  return {
    ...structuredClone(section),
    id: newId("sec"),
    blocks: section.blocks.map((block) => ({ ...structuredClone(block), id: newId("blk") })),
  };
}

// ---------------------------------------------------------------------------
// Sanitisation. Theme documents come from tenants (untrusted) and are rendered
// on public storefronts, so every value is coerced to its schema: unknown
// sections/blocks/keys are dropped, enums/ranges clamped, and URLs restricted
// to safe schemes. Runs on the server before every save.
// ---------------------------------------------------------------------------

const SAFE_URL = /^(https?:\/\/|\/(?!\/)|#|mailto:|tel:)/i;
// Uploaded images arrive as data URLs in mock mode (raster formats only: SVG can carry script).
const SAFE_IMAGE_URL = /^(https?:\/\/|\/(?!\/)|data:image\/(png|jpe?g|webp|gif|avif);base64,)/i;
export const MAX_IMAGE_URL_LENGTH = 1_500_000;
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export const isSafeLinkUrl = (value: string) => value === "" || SAFE_URL.test(value.trim());
export const isSafeImageUrl = (value: string) => value === "" || SAFE_IMAGE_URL.test(value.trim());

function sanitizeValue(field: SettingField, raw: unknown): SettingValue {
  switch (field.type) {
    case "text":
      return typeof raw === "string" ? raw.slice(0, 300) : field.default;
    case "textarea":
      return typeof raw === "string" ? raw.slice(0, 3000) : field.default;
    case "url":
      if (typeof raw !== "string") return field.default;
      return isSafeLinkUrl(raw) ? raw.trim().slice(0, 2000) : field.default;
    case "image":
      if (typeof raw !== "string") return field.default;
      return isSafeImageUrl(raw) && raw.length <= MAX_IMAGE_URL_LENGTH ? raw.trim() : field.default;
    case "color":
      return typeof raw === "string" && HEX_COLOR.test(raw) ? raw.toLowerCase() : field.default;
    case "checkbox":
      return typeof raw === "boolean" ? raw : field.default;
    case "range": {
      const n = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(n)) return field.default;
      const step = field.step ?? 1;
      const stepped = Math.round((n - field.min) / step) * step + field.min;
      return Math.min(field.max, Math.max(field.min, stepped));
    }
    case "select":
      return field.options.some((option) => option.value === raw) ? (raw as string) : field.default;
  }
}

export function sanitizeSettings(fields: SettingField[], raw: Record<string, unknown>) {
  return Object.fromEntries(
    fields.map((field) => [field.id, sanitizeValue(field, raw[field.id])]),
  );
}

const RawDocumentSchema = z.object({
  settings: z.record(z.string(), z.unknown()).default({}),
  sections: z
    .array(
      z.object({
        id: z.string().max(64),
        type: z.string().max(64),
        settings: z.record(z.string(), z.unknown()).default({}),
        blocks: z
          .array(
            z.object({
              id: z.string().max(64),
              type: z.string().max(64),
              settings: z.record(z.string(), z.unknown()).default({}),
            }),
          )
          .default([]),
      }),
    )
    .max(MAX_SECTIONS),
});

export function sanitizeDocument(input: unknown): ThemeDocument {
  const raw = RawDocumentSchema.parse(input);
  const seenIds = new Set<string>();
  const seenSingletons = new Set<string>();
  const uniqueId = (id: string, prefix: string) => {
    const next = id && !seenIds.has(id) ? id : newId(prefix);
    seenIds.add(next);
    return next;
  };

  const sections: SectionInstance[] = [];
  for (const section of raw.sections) {
    const schema = getSectionSchema(section.type);
    if (!schema) continue;
    if (schema.singleton) {
      if (seenSingletons.has(schema.type)) continue;
      seenSingletons.add(schema.type);
    }

    const blocks: BlockInstance[] = [];
    for (const block of section.blocks) {
      const blockSchema = schema.blocks?.find((b) => b.type === block.type);
      if (!blockSchema) continue;
      if (schema.maxBlocks !== undefined && blocks.length >= schema.maxBlocks) break;
      blocks.push({
        id: uniqueId(block.id, "blk"),
        type: block.type,
        settings: sanitizeSettings(blockSchema.settings, block.settings),
      });
    }

    sections.push({
      id: uniqueId(section.id, "sec"),
      type: section.type,
      settings: sanitizeSettings(schema.settings, section.settings),
      blocks,
    });
  }

  return {
    settings: sanitizeSettings(THEME_SETTINGS_SCHEMA, raw.settings),
    sections,
  };
}

export function createThemeDocument(
  sectionTypes: string[],
  settingsOverrides: Partial<SettingValues> = {},
): ThemeDocument {
  return {
    settings: { ...defaultValues(THEME_SETTINGS_SCHEMA), ...settingsOverrides } as SettingValues,
    sections: sectionTypes.map(createSection),
  };
}
