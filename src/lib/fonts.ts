import {
  Cormorant_Garamond,
  DM_Sans,
  Fraunces,
  Inter,
  Manrope,
  Outfit,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";

// Fonts offered to storefront themes. Self-hosted by next/font; everything but
// Inter (the admin UI font) skips preloading, so a font's files are only
// downloaded by pages that actually use it.
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap", preload: false });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", preload: false });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap", preload: false });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", preload: false });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false,
});

export const fontVariables = [inter, dmSans, manrope, outfit, spaceGrotesk, playfair, fraunces, cormorant]
  .map((font) => font.variable)
  .join(" ");
