import type { SectionSchema, SettingField } from "./types";

// Declarative schemas for everything a theme can customise. The builder's
// settings panel, defaults, validation and sanitisation are all generated
// from these, so adding a setting here is the whole job.

// ------------------------------------------------------------------ fonts

export const FONTS: Record<string, { label: string; stack: string; kind: "sans" | "serif" }> = {
  inter: { label: "Inter", stack: "var(--font-inter), ui-sans-serif, system-ui, sans-serif", kind: "sans" },
  "dm-sans": { label: "DM Sans", stack: "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif", kind: "sans" },
  manrope: { label: "Manrope", stack: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif", kind: "sans" },
  outfit: { label: "Outfit", stack: "var(--font-outfit), ui-sans-serif, system-ui, sans-serif", kind: "sans" },
  "space-grotesk": { label: "Space Grotesk", stack: "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif", kind: "sans" },
  playfair: { label: "Playfair Display", stack: "var(--font-playfair), ui-serif, Georgia, serif", kind: "serif" },
  fraunces: { label: "Fraunces", stack: "var(--font-fraunces), ui-serif, Georgia, serif", kind: "serif" },
  cormorant: { label: "Cormorant", stack: "var(--font-cormorant), ui-serif, Georgia, serif", kind: "serif" },
};

/** Curated heading + body combinations offered in the simple customizer. */
export const FONT_PAIRINGS = [
  { id: "modern", label: "Modern", description: "Clean and neutral", heading: "inter", body: "inter" },
  { id: "editorial", label: "Editorial", description: "Magazine-style contrast", heading: "playfair", body: "dm-sans" },
  { id: "elegant", label: "Elegant", description: "Refined and luxurious", heading: "cormorant", body: "manrope" },
  { id: "friendly", label: "Friendly", description: "Round and approachable", heading: "outfit", body: "dm-sans" },
  { id: "technical", label: "Technical", description: "Precise and contemporary", heading: "space-grotesk", body: "inter" },
  { id: "classic", label: "Classic", description: "Warm, bookish serif", heading: "fraunces", body: "manrope" },
] as const;

const fontOptions = Object.entries(FONTS).map(([value, font]) => ({ value, label: font.label }));

// --------------------------------------------------------- global settings

export const THEME_SETTINGS_GROUPS: { name: string; settings: SettingField[] }[] = [
  {
    name: "Colors",
    settings: [
      { type: "color", id: "colorBackground", label: "Background", default: "#ffffff" },
      { type: "color", id: "colorSurface", label: "Surface", default: "#f4f4f5", info: "Cards, panels and alternate sections." },
      { type: "color", id: "colorText", label: "Text", default: "#18181b" },
      // Empty default means "auto", so themes saved before these existed keep their look.
      { type: "color", id: "colorHeading", label: "Headings", default: "", info: "Leave empty to use the text color." },
      { type: "color", id: "colorBorder", label: "Borders", default: "", info: "Leave empty to derive from text and background." },
      { type: "color", id: "colorPrimary", label: "Brand / buttons", default: "#18181b" },
      { type: "color", id: "colorPrimaryText", label: "Button text", default: "#ffffff" },
      { type: "color", id: "colorSale", label: "Sale price & badges", default: "#b91c1c" },
    ],
  },
  {
    name: "Typography",
    settings: [
      { type: "select", id: "fontHeading", label: "Heading font", default: "inter", options: fontOptions },
      { type: "select", id: "fontBody", label: "Body font", default: "inter", options: fontOptions },
      { type: "range", id: "headingScale", label: "Heading size", default: 100, min: 80, max: 130, step: 5, unit: "%" },
      { type: "select", id: "headingCase", label: "Heading style", default: "none", options: [
        { value: "none", label: "As written" },
        { value: "uppercase", label: "Uppercase" },
      ] },
    ],
  },
  {
    name: "Layout",
    settings: [
      { type: "range", id: "pageWidth", label: "Page width", default: 1320, min: 1080, max: 1600, step: 40, unit: "px" },
      { type: "range", id: "radius", label: "Corner radius", default: 6, min: 0, max: 24, unit: "px" },
      { type: "select", id: "buttonShape", label: "Button shape", default: "rounded", options: [
        { value: "sharp", label: "Sharp" },
        { value: "rounded", label: "Rounded" },
        { value: "pill", label: "Pill" },
      ] },
    ],
  },
  {
    name: "Header",
    settings: [
      { type: "select", id: "headerLayout", label: "Logo position", default: "left", options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
      ] },
      { type: "checkbox", id: "headerSticky", label: "Stick to top when scrolling", default: true },
    ],
  },
  {
    name: "Product cards",
    settings: [
      { type: "select", id: "cardImageRatio", label: "Image shape", default: "portrait", options: [
        { value: "portrait", label: "Portrait" },
        { value: "square", label: "Square" },
      ] },
      { type: "checkbox", id: "cardHoverImage", label: "Show second image on hover", default: true },
      { type: "checkbox", id: "cardShowBrand", label: "Show brand", default: true },
      { type: "checkbox", id: "cardShowRating", label: "Show rating", default: true },
      { type: "checkbox", id: "cardQuickAdd", label: "Quick add button", default: true },
    ],
  },
  {
    name: "Motion",
    settings: [{ type: "checkbox", id: "animations", label: "Subtle animations", default: true, info: "Reveal-on-scroll and hover effects. Always off for visitors who prefer reduced motion." }],
  },
];

export const THEME_SETTINGS_SCHEMA: SettingField[] = THEME_SETTINGS_GROUPS.flatMap((group) => group.settings);

/** Keys the simple customizer may change: the page palette, brand color and fonts. */
export const BRAND_SETTING_KEYS = [
  "colorPrimary",
  "colorPrimaryText",
  "colorBackground",
  "colorSurface",
  "colorText",
  "colorHeading",
  "colorBorder",
  "fontHeading",
  "fontBody",
] as const;

// ---------------------------------------------------------------- sections

export const COLLECTION_OPTIONS = [
  { value: "all", label: "All products" },
  { value: "new-arrivals", label: "New arrivals" },
  { value: "best-sellers", label: "Best sellers" },
  { value: "sale", label: "On sale" },
];

export const FEATURE_ICONS = [
  { value: "truck", label: "Delivery" },
  { value: "refresh", label: "Returns" },
  { value: "shield", label: "Warranty" },
  { value: "message", label: "Support" },
  { value: "leaf", label: "Sustainable" },
  { value: "gift", label: "Gift" },
  { value: "lock", label: "Secure checkout" },
  { value: "star", label: "Quality" },
  { value: "heart", label: "Handmade" },
  { value: "sparkles", label: "Sparkles" },
];

const colorScheme: SettingField = {
  type: "select",
  id: "colorScheme",
  label: "Colors",
  default: "default",
  options: [
    { value: "default", label: "Background" },
    { value: "surface", label: "Surface" },
    { value: "inverse", label: "Brand color" },
    { value: "dark", label: "Dark" },
  ],
};

const spacing: SettingField = {
  type: "select",
  id: "spacing",
  label: "Spacing",
  default: "medium",
  options: [
    { value: "none", label: "None" },
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ],
};

const align = (defaultValue: "left" | "center"): SettingField => ({
  type: "select",
  id: "alignment",
  label: "Alignment",
  default: defaultValue,
  options: [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
  ],
});

const withLayout = (settings: SettingField[], scheme: string = "default"): SettingField[] => [
  ...settings,
  { ...colorScheme, default: scheme } as SettingField,
  spacing,
];

export const SECTION_SCHEMAS: SectionSchema[] = [
  {
    type: "hero",
    name: "Hero banner",
    description: "Full-width image with a headline and buttons.",
    category: "hero",
    maxBlocks: 2,
    defaultBlocks: ["button"],
    settings: [
      { type: "select", id: "layout", label: "Layout", default: "overlay", options: [
        { value: "overlay", label: "Text over image" },
        { value: "split", label: "Image beside text" },
      ] },
      { type: "image", id: "image", label: "Image", default: "" },
      { type: "text", id: "eyebrow", label: "Small heading", default: "New season" },
      { type: "text", id: "heading", label: "Heading", default: "Discover the new collection" },
      { type: "textarea", id: "text", label: "Text", default: "Thoughtfully designed essentials, made to last." },
      align("left"),
      { type: "select", id: "height", label: "Height", default: "large", options: [
        { value: "medium", label: "Medium" },
        { value: "large", label: "Large" },
        { value: "full", label: "Full screen" },
      ] },
      { type: "range", id: "overlay", label: "Image darkening", default: 25, min: 0, max: 70, step: 5, unit: "%" },
      { ...colorScheme, info: "Used by the \"Image beside text\" layout." } as SettingField,
    ],
    blocks: [
      {
        type: "button",
        name: "Button",
        settings: [
          { type: "text", id: "label", label: "Label", default: "Shop now" },
          { type: "url", id: "url", label: "Link", default: "/products" },
          { type: "select", id: "style", label: "Style", default: "primary", options: [
            { value: "primary", label: "Solid" },
            { value: "secondary", label: "Outline" },
          ] },
        ],
      },
    ],
  },
  {
    type: "marquee",
    name: "Scrolling text",
    description: "A slow-moving strip of short messages.",
    category: "content",
    settings: withLayout([
      { type: "text", id: "items", label: "Messages", default: "Free shipping over $75 | 30-day returns | Secure checkout", info: "Separate messages with |" },
      { type: "range", id: "speed", label: "Speed", default: 40, min: 15, max: 80, step: 5, unit: "s" },
    ], "inverse"),
  },
  {
    type: "categories",
    name: "Shop by category",
    description: "Image tiles for your product categories.",
    category: "products",
    settings: withLayout([
      { type: "text", id: "heading", label: "Heading", default: "Shop by category" },
      { type: "text", id: "subheading", label: "Subheading", default: "" },
      { type: "range", id: "count", label: "Categories to show", default: 4, min: 2, max: 8 },
      { type: "range", id: "columns", label: "Columns on desktop", default: 4, min: 2, max: 5 },
      { type: "select", id: "style", label: "Style", default: "overlay", options: [
        { value: "overlay", label: "Name on image" },
        { value: "caption", label: "Name below image" },
      ] },
    ]),
  },
  {
    type: "products",
    name: "Product grid",
    description: "Products from a collection, as a grid or carousel.",
    category: "products",
    settings: withLayout([
      { type: "text", id: "heading", label: "Heading", default: "Featured products" },
      { type: "text", id: "subheading", label: "Subheading", default: "" },
      { type: "select", id: "collection", label: "Collection", default: "all", options: COLLECTION_OPTIONS },
      { type: "range", id: "count", label: "Products to show", default: 8, min: 2, max: 12 },
      { type: "range", id: "columns", label: "Columns on desktop", default: 4, min: 2, max: 5 },
      { type: "select", id: "layout", label: "Layout", default: "grid", options: [
        { value: "grid", label: "Grid" },
        { value: "carousel", label: "Carousel" },
      ] },
      { type: "checkbox", id: "showViewAll", label: "Show \"View all\" link", default: true },
    ]),
  },
  {
    type: "promo-banner",
    name: "Promo banner",
    description: "A wide image with an offer and a call to action.",
    category: "hero",
    settings: withLayout([
      { type: "image", id: "image", label: "Image", default: "" },
      { type: "text", id: "eyebrow", label: "Small heading", default: "Limited time" },
      { type: "text", id: "heading", label: "Heading", default: "Up to 30% off selected styles" },
      { type: "textarea", id: "text", label: "Text", default: "Ends Sunday. While stocks last." },
      { type: "text", id: "buttonLabel", label: "Button label", default: "Shop the sale" },
      { type: "url", id: "buttonUrl", label: "Button link", default: "/products?collection=sale" },
      align("center"),
      { type: "select", id: "height", label: "Height", default: "medium", options: [
        { value: "small", label: "Small" },
        { value: "medium", label: "Medium" },
        { value: "large", label: "Large" },
      ] },
      { type: "range", id: "overlay", label: "Image darkening", default: 35, min: 0, max: 70, step: 5, unit: "%" },
    ]),
  },
  {
    type: "collection-tiles",
    name: "Collection tiles",
    description: "Two or three large image links to collections.",
    category: "hero",
    maxBlocks: 4,
    defaultBlocks: ["tile", "tile"],
    settings: withLayout([{ type: "text", id: "heading", label: "Heading", default: "" }]),
    blocks: [
      {
        type: "tile",
        name: "Tile",
        settings: [
          { type: "image", id: "image", label: "Image", default: "" },
          { type: "text", id: "title", label: "Title", default: "New arrivals" },
          { type: "text", id: "label", label: "Link text", default: "Shop now" },
          { type: "url", id: "url", label: "Link", default: "/products?collection=new-arrivals" },
        ],
      },
    ],
  },
  {
    type: "image-with-text",
    name: "Image with text",
    description: "Tell your story beside a large image.",
    category: "content",
    settings: withLayout([
      { type: "image", id: "image", label: "Image", default: "" },
      { type: "select", id: "imagePosition", label: "Image position", default: "left", options: [
        { value: "left", label: "Left" },
        { value: "right", label: "Right" },
      ] },
      { type: "text", id: "eyebrow", label: "Small heading", default: "Our story" },
      { type: "text", id: "heading", label: "Heading", default: "Crafted with care" },
      { type: "textarea", id: "text", label: "Text", default: "Every piece is made in small batches using responsibly sourced materials, by people who love what they do." },
      { type: "text", id: "buttonLabel", label: "Button label", default: "Learn more" },
      { type: "url", id: "buttonUrl", label: "Button link", default: "/products" },
    ]),
  },
  {
    type: "features",
    name: "Features",
    description: "Icons with short promises: delivery, returns, quality.",
    category: "content",
    maxBlocks: 6,
    defaultBlocks: ["feature", "feature", "feature"],
    settings: withLayout([
      { type: "text", id: "heading", label: "Heading", default: "" },
      { type: "range", id: "columns", label: "Columns on desktop", default: 4, min: 2, max: 6 },
      align("center"),
    ], "surface"),
    blocks: [
      {
        type: "feature",
        name: "Feature",
        settings: [
          { type: "select", id: "icon", label: "Icon", default: "truck", options: FEATURE_ICONS },
          { type: "text", id: "title", label: "Title", default: "Free shipping" },
          { type: "textarea", id: "text", label: "Text", default: "On all orders over $75." },
        ],
      },
    ],
  },
  {
    type: "brands",
    name: "Brand list",
    description: "The brands you carry, linking to their products.",
    category: "social",
    settings: withLayout([
      { type: "text", id: "heading", label: "Heading", default: "Our brands" },
      { type: "select", id: "style", label: "Style", default: "cards", options: [
        { value: "cards", label: "Image cards" },
        { value: "wordmarks", label: "Names only" },
      ] },
    ]),
  },
  {
    type: "testimonials",
    name: "Testimonials",
    description: "Quotes from happy customers.",
    category: "social",
    maxBlocks: 6,
    defaultBlocks: ["testimonial", "testimonial", "testimonial"],
    settings: withLayout([{ type: "text", id: "heading", label: "Heading", default: "Loved by customers" }], "surface"),
    blocks: [
      {
        type: "testimonial",
        name: "Testimonial",
        settings: [
          { type: "textarea", id: "quote", label: "Quote", default: "Beautiful quality and fast delivery. I've already ordered again." },
          { type: "text", id: "author", label: "Name", default: "Emma W." },
          { type: "text", id: "detail", label: "Detail", default: "Verified buyer" },
          { type: "range", id: "rating", label: "Stars", default: 5, min: 1, max: 5 },
        ],
      },
    ],
  },
  {
    type: "newsletter",
    name: "Newsletter",
    description: "Email sign-up to grow your audience.",
    category: "social",
    settings: withLayout([
      { type: "text", id: "heading", label: "Heading", default: "Join our newsletter" },
      { type: "textarea", id: "text", label: "Text", default: "New arrivals, restocks and members-only offers. No spam, ever." },
      { type: "text", id: "buttonLabel", label: "Button label", default: "Subscribe" },
    ], "surface"),
  },
  {
    type: "rich-text",
    name: "Text",
    description: "A heading and a paragraph, centred on the page.",
    category: "content",
    settings: withLayout([
      { type: "text", id: "eyebrow", label: "Small heading", default: "" },
      { type: "text", id: "heading", label: "Heading", default: "Talk about your brand" },
      { type: "textarea", id: "text", label: "Text", default: "Share what makes your products special, and why customers keep coming back." },
      { type: "text", id: "buttonLabel", label: "Button label", default: "" },
      { type: "url", id: "buttonUrl", label: "Button link", default: "/products" },
      align("center"),
    ]),
  },
];

const SCHEMA_BY_TYPE = new Map(SECTION_SCHEMAS.map((schema) => [schema.type, schema]));

export function getSectionSchema(type: string): SectionSchema | undefined {
  return SCHEMA_BY_TYPE.get(type);
}

export function getBlockSchema(sectionType: string, blockType: string) {
  return getSectionSchema(sectionType)?.blocks?.find((block) => block.type === blockType);
}
