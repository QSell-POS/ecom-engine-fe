// Core, framework-agnostic types for the theme engine. Everything a tenant can
// customise is plain JSON (a ThemeDocument) validated against declarative
// schemas, so it can be stored by any backend and rendered anywhere.

export type SettingValue = string | number | boolean;
export type SettingValues = Record<string, SettingValue>;

type BaseField = { id: string; label: string; info?: string };

export type SettingField =
  | (BaseField & { type: "text"; default: string; placeholder?: string })
  | (BaseField & { type: "textarea"; default: string })
  | (BaseField & { type: "url"; default: string })
  | (BaseField & { type: "image"; default: string })
  | (BaseField & { type: "color"; default: string })
  | (BaseField & { type: "checkbox"; default: boolean })
  | (BaseField & {
      type: "range";
      default: number;
      min: number;
      max: number;
      step?: number;
      unit?: string;
    })
  | (BaseField & {
      type: "select";
      default: string;
      options: { value: string; label: string }[];
    });

export type BlockSchema = {
  type: string;
  name: string;
  settings: SettingField[];
};

export type SectionCategory = "hero" | "products" | "content" | "social";

export type SectionSchema = {
  type: string;
  name: string;
  description: string;
  category: SectionCategory;
  settings: SettingField[];
  blocks?: BlockSchema[];
  maxBlocks?: number;
  /** Block types (in order) a freshly-added section starts with. */
  defaultBlocks?: string[];
  /** Only one instance of this section allowed per page (e.g. header). */
  singleton?: boolean;
};

export type BlockInstance = {
  id: string;
  type: string;
  settings: SettingValues;
};

export type SectionInstance = {
  id: string;
  type: string;
  settings: SettingValues;
  blocks: BlockInstance[];
};

export type ThemeDocument = {
  /** Global theme settings: colours, typography, layout. */
  settings: SettingValues;
  sections: SectionInstance[];
};

export type Selection =
  | { kind: "theme" }
  | { kind: "section"; sectionId: string }
  | { kind: "block"; sectionId: string; blockId: string };

export type Device = "desktop" | "tablet" | "mobile";
