import type { Vertical } from "@/lib/storefront/types";
import { createBlock, createSection, defaultValues } from "./document";
import { THEME_SETTINGS_SCHEMA } from "./schema";
import type { SectionInstance, SettingValues, ThemeDocument } from "./types";

// Ready-made themes. Each is a complete, opinionated storefront: design
// tokens plus a finished home page. A merchant can install one and launch
// without ever opening the builder. Image settings are left empty on purpose:
// sections fall back to the store's own imagery (StoreMedia), so a theme
// looks right with any catalog.

type BlockSpec = [blockType: string, settings?: SettingValues];

function section(type: string, settings: SettingValues = {}, blocks?: BlockSpec[]): SectionInstance {
  const base = createSection(type);
  return {
    ...base,
    settings: { ...base.settings, ...settings },
    blocks: blocks
      ? blocks.map(([blockType, overrides]) => {
          const block = createBlock(type, blockType);
          return { ...block, settings: { ...block.settings, ...overrides } };
        })
      : base.blocks,
  };
}

function doc(settings: SettingValues, sections: SectionInstance[]): ThemeDocument {
  return { settings: { ...defaultValues(THEME_SETTINGS_SCHEMA), ...settings }, sections };
}

export type ThemePreset = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Demo content shown in the theme store preview. */
  vertical: Vertical;
  demo: { storeName: string; tagline: string };
  industries: string[];
  style: string[];
  features: string[];
  /** Background, surface, text, brand: for the marketplace swatches. */
  palette: string[];
  build: () => ThemeDocument;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "maison",
    name: "Maison",
    tagline: "Editorial fashion with a quiet, luxurious feel.",
    description:
      "Large imagery, refined serif headlines and generous whitespace put your collection centre stage. Built for apparel and accessories brands that want their store to feel like a lookbook.",
    vertical: "fashion",
    demo: { storeName: "Maison", tagline: "Considered clothing for everyday life." },
    industries: ["Fashion", "Accessories", "Jewelry"],
    style: ["Editorial", "Minimal", "Luxury"],
    features: ["Full-screen hero", "Hover image swap", "Collection tiles", "Scrolling announcement", "Portrait product cards"],
    palette: ["#faf8f5", "#efe9e1", "#1c1917", "#1c1917"],
    build: () =>
      doc(
        {
          colorBackground: "#faf8f5",
          colorSurface: "#efe9e1",
          colorText: "#1c1917",
          colorPrimary: "#1c1917",
          colorPrimaryText: "#faf8f5",
          colorSale: "#9f1239",
          fontHeading: "cormorant",
          fontBody: "manrope",
          headingScale: 115,
          radius: 0,
          buttonShape: "sharp",
          headerLayout: "center",
          cardImageRatio: "portrait",
        },
        [
          section("hero", { eyebrow: "The Autumn Edit", heading: "Quiet luxury, everyday", text: "Soft tailoring, rich textures and pieces you'll wear for years.", height: "full", alignment: "left", overlay: 30 }, [
            ["button", { label: "Shop new arrivals", url: "/products?collection=new-arrivals" }],
            ["button", { label: "Explore the edit", url: "/products", style: "secondary" }],
          ]),
          section("categories", { heading: "Shop by category", count: 4, columns: 4, style: "caption", spacing: "large" }),
          section("products", { heading: "New arrivals", subheading: "Just landed this week", collection: "new-arrivals", count: 8, columns: 4 }),
          section("collection-tiles", { spacing: "small" }, [
            ["tile", { title: "Knitwear", label: "Shop knitwear", url: "/categories/knitwear" }],
            ["tile", { title: "The shoe edit", label: "Shop shoes", url: "/categories/shoes" }],
          ]),
          section("products", { heading: "Best sellers", collection: "best-sellers", count: 4, columns: 4, layout: "carousel" }),
          section("image-with-text", { eyebrow: "Our atelier", heading: "Made slowly, made to last", text: "We work with a handful of family-run workshops in Portugal and Italy, using natural fibres and deadstock fabrics. Fewer pieces, made properly.", buttonLabel: "Discover the collection", imagePosition: "right", colorScheme: "surface" }),
          section("testimonials", { heading: "Worn and loved", colorScheme: "default" }, [
            ["testimonial", { quote: "The quality is exceptional. My leather jacket gets better every week I wear it.", author: "Sofia R.", detail: "Cropped Leather Jacket" }],
            ["testimonial", { quote: "Beautiful packaging, fast shipping and the linen dress fits like a dream.", author: "Emma W.", detail: "Linen Wrap Dress" }],
            ["testimonial", { quote: "Finally, basics that don't lose their shape after a few washes.", author: "Noah B.", detail: "Essential Cotton Tee" }],
          ]),
          section("newsletter", { heading: "Join the Maison list", text: "Early access to new collections and private sales.", colorScheme: "dark" }),
        ],
      ),
  },
  {
    id: "volt",
    name: "Volt",
    tagline: "Bold, conversion-focused layout for tech and electronics.",
    description:
      "Crisp grids, strong calls to action and trust signals up front. Volt is designed for larger catalogs where shoppers compare, filter and buy quickly: perfect for electronics, gadgets and gear.",
    vertical: "electronics",
    demo: { storeName: "Volt", tagline: "The tech you'll actually use." },
    industries: ["Electronics", "Gadgets", "Sports gear"],
    style: ["Bold", "Modern", "High-conversion"],
    features: ["Split hero", "Trust badges", "Product carousels", "Promo banner", "Square product cards"],
    palette: ["#ffffff", "#f1f5f9", "#0b1220", "#2563eb"],
    build: () =>
      doc(
        {
          colorBackground: "#ffffff",
          colorSurface: "#f1f5f9",
          colorText: "#0b1220",
          colorPrimary: "#2563eb",
          colorPrimaryText: "#ffffff",
          colorSale: "#dc2626",
          fontHeading: "space-grotesk",
          fontBody: "inter",
          headingScale: 105,
          radius: 12,
          buttonShape: "rounded",
          headerLayout: "left",
          cardImageRatio: "square",
          cardHoverImage: false,
        },
        [
          section("hero", { layout: "split", eyebrow: "New · Aurora ANC", heading: "Sound that moves with you", text: "Adaptive noise cancelling, 30-hour battery and studio-grade drivers. Now with free next-day delivery.", height: "medium", colorScheme: "surface" }, [
            ["button", { label: "Shop audio", url: "/categories/audio" }],
            ["button", { label: "See all deals", url: "/products?collection=sale", style: "secondary" }],
          ]),
          section("features", { columns: 4, spacing: "small", alignment: "left", colorScheme: "default" }, [
            ["feature", { icon: "truck", title: "Free next-day delivery", text: "On orders over $75" }],
            ["feature", { icon: "shield", title: "2-year warranty", text: "On everything we sell" }],
            ["feature", { icon: "refresh", title: "30-day returns", text: "No questions asked" }],
            ["feature", { icon: "message", title: "Expert support", text: "Real people, 7 days a week" }],
          ]),
          section("categories", { heading: "Shop by category", count: 6, columns: 3, style: "overlay" }),
          section("products", { heading: "Best sellers", subheading: "What everyone's buying right now", collection: "best-sellers", count: 8, columns: 4, layout: "carousel" }),
          section("promo-banner", { eyebrow: "This week only", heading: "Up to 25% off laptops & audio", text: "Save on our most-loved tech. Ends Sunday.", buttonLabel: "Shop the sale", alignment: "left", height: "medium" }),
          section("products", { heading: "On sale now", collection: "sale", count: 4, columns: 4 }),
          section("brands", { heading: "Shop by brand", style: "cards", colorScheme: "surface" }),
          section("newsletter", { heading: "Get deals first", text: "Weekly drops, restocks and subscriber-only discounts.", colorScheme: "inverse" }),
        ],
      ),
  },
  {
    id: "petal",
    name: "Petal",
    tagline: "Soft, airy and trustworthy, made for beauty brands.",
    description:
      "Rounded shapes, warm neutrals and gentle serif headlines give Petal a calm, premium feel. Ingredient stories, reviews and rituals help shoppers choose with confidence.",
    vertical: "beauty",
    demo: { storeName: "Petal", tagline: "Clean skincare, beautifully simple." },
    industries: ["Beauty", "Skincare", "Wellness"],
    style: ["Soft", "Warm", "Premium"],
    features: ["Story sections", "Testimonials", "Pill buttons", "Scrolling promises", "Rituals banner"],
    palette: ["#fdf8f5", "#f6e9e2", "#3b2a26", "#a05a4f"],
    build: () =>
      doc(
        {
          colorBackground: "#fdf8f5",
          colorSurface: "#f6e9e2",
          colorText: "#3b2a26",
          colorPrimary: "#a05a4f",
          colorPrimaryText: "#ffffff",
          colorSale: "#b4534b",
          fontHeading: "fraunces",
          fontBody: "manrope",
          headingScale: 105,
          radius: 18,
          buttonShape: "pill",
          headerLayout: "center",
          cardImageRatio: "portrait",
        },
        [
          section("hero", { eyebrow: "New · Vitamin C Serum", heading: "Skin, simplified", text: "Gentle, plant-powered formulas that give real results, without the 12-step routine.", height: "large", alignment: "left", overlay: 15 }, [
            ["button", { label: "Shop skincare", url: "/categories/skincare" }],
          ]),
          section("marquee", { items: "Vegan & cruelty-free | Dermatologist tested | Recyclable glass | Free samples with every order", colorScheme: "surface", spacing: "none" }),
          section("products", { heading: "Customer favourites", collection: "best-sellers", count: 4, columns: 4 }),
          section("image-with-text", { eyebrow: "What's inside", heading: "Clean ingredients, clinically proven", text: "Every formula is built around a handful of high-performance actives, like vitamin C, retinal and ceramides, and nothing your skin doesn't need.", buttonLabel: "Discover serums", buttonUrl: "/categories/serums", colorScheme: "surface" }),
          section("categories", { heading: "Find your ritual", count: 5, columns: 5, style: "caption" }),
          section("testimonials", { heading: "Real skin, real results" }, [
            ["testimonial", { quote: "My skin has never looked calmer. The night serum is pure magic.", author: "Mia T.", detail: "Night Recovery Serum" }],
            ["testimonial", { quote: "I have very sensitive skin and this is the first cleanser that doesn't sting.", author: "Chloe D.", detail: "Gentle Daily Cleanser" }],
            ["testimonial", { quote: "The rose parfum is my new signature. So many compliments.", author: "Ava M.", detail: "Rose Eau de Parfum" }],
          ]),
          section("promo-banner", { eyebrow: "Gift sets", heading: "The perfect ritual, beautifully boxed", text: "Curated sets that save you up to 20%.", buttonLabel: "Shop gift sets", buttonUrl: "/categories/sets", height: "medium", overlay: 25 }),
          section("newsletter", { heading: "Glow notes", text: "Skin tips, new launches and 10% off your first order.", colorScheme: "surface" }),
        ],
      ),
  },
  {
    id: "hearth",
    name: "Hearth",
    tagline: "Warm, natural and calm for home & living stores.",
    description:
      "Earthy tones, elegant display type and spacious room-set imagery help customers imagine your pieces at home. Ideal for furniture, decor, ceramics and plant shops.",
    vertical: "home",
    demo: { storeName: "Hearth", tagline: "Furniture and objects for slow living." },
    industries: ["Home & garden", "Furniture", "Decor"],
    style: ["Warm", "Natural", "Elegant"],
    features: ["Room-set imagery", "Category tiles", "Brand cards", "Story section", "Landscape banners"],
    palette: ["#f7f4ef", "#ebe4d8", "#2d2a26", "#4a5a45"],
    build: () =>
      doc(
        {
          colorBackground: "#f7f4ef",
          colorSurface: "#ebe4d8",
          colorText: "#2d2a26",
          colorPrimary: "#4a5a45",
          colorPrimaryText: "#f7f4ef",
          colorSale: "#b45309",
          fontHeading: "playfair",
          fontBody: "outfit",
          headingScale: 105,
          radius: 4,
          buttonShape: "rounded",
          headerLayout: "left",
          cardImageRatio: "square",
        },
        [
          section("hero", { eyebrow: "Autumn at home", heading: "Slow living, made beautiful", text: "Solid wood, natural linen and hand-thrown ceramics for a home that restores you.", height: "large", alignment: "center", overlay: 30 }, [
            ["button", { label: "Shop the collection", url: "/products" }],
          ]),
          section("categories", { heading: "Shop by room", count: 5, columns: 5, style: "overlay" }),
          section("products", { heading: "New in", subheading: "Fresh pieces for the season", collection: "new-arrivals", count: 8, columns: 4 }),
          section("collection-tiles", {}, [
            ["tile", { title: "Living room", label: "Shop sofas & chairs", url: "/categories/living" }],
            ["tile", { title: "Lighting", label: "Shop lighting", url: "/categories/lighting" }],
            ["tile", { title: "Bedroom", label: "Shop bedroom", url: "/categories/bedroom" }],
          ]),
          section("image-with-text", { eyebrow: "Our makers", heading: "Built to be passed down", text: "Every piece is made by independent workshops using solid hardwoods and natural finishes. Delivered free by our own two-person team.", buttonLabel: "Meet our brands", buttonUrl: "/brands", imagePosition: "left" }),
          section("features", { columns: 3, colorScheme: "surface" }, [
            ["feature", { icon: "truck", title: "Free white-glove delivery", text: "Placed in the room of your choice." }],
            ["feature", { icon: "leaf", title: "Responsibly made", text: "FSC-certified woods and natural fibres." }],
            ["feature", { icon: "shield", title: "10-year guarantee", text: "On every frame we build." }],
          ]),
          section("brands", { heading: "Makers we love", style: "cards" }),
          section("newsletter", { heading: "Letters from Hearth", text: "Seasonal edits, styling ideas and first look at new pieces.", colorScheme: "inverse" }),
        ],
      ),
  },
];

const PRESETS_BY_ID = new Map(THEME_PRESETS.map((preset) => [preset.id, preset]));

export function getPreset(id: string): ThemePreset | undefined {
  return PRESETS_BY_ID.get(id);
}

export const DEMO_STORE_PREFIX = "demo-";
export const demoStoreSlug = (presetId: string) => `${DEMO_STORE_PREFIX}${presetId}`;
