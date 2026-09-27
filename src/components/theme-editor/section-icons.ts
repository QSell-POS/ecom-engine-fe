import { createElement } from "react";
import {
  AlignLeft,
  Award,
  Columns3,
  GalleryHorizontal,
  Image,
  LayoutGrid,
  Mail,
  MoveHorizontal,
  Quote,
  Shapes,
  Square,
  SquareSplitHorizontal,
  Ticket,
  type LucideIcon,
} from "lucide-react";

// One monochrome glyph per section type, used in the layers list, library,
// canvas labels and settings header so a section is recognisable everywhere.
const ICONS: Record<string, LucideIcon> = {
  hero: Image,
  marquee: MoveHorizontal,
  categories: Shapes,
  products: LayoutGrid,
  "promo-banner": Ticket,
  "collection-tiles": GalleryHorizontal,
  "image-with-text": SquareSplitHorizontal,
  features: Columns3,
  brands: Award,
  testimonials: Quote,
  newsletter: Mail,
  "rich-text": AlignLeft,
};

export function SectionIcon({ type, className }: { type: string; className?: string }) {
  return createElement(ICONS[type] ?? Square, { className, "aria-hidden": true });
}
