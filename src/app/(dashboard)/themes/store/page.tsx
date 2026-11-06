import type { Metadata } from "next";
import { ThemeStoreGrid } from "@/components/themes/ThemeStoreGrid";
import { listThemes } from "@/lib/api/theme";
import { THEME_PRESETS } from "@/lib/theme-engine/presets";
import { presetPreview } from "../previews";
import { denyUnless } from "@/lib/api/rbac/access";

export const metadata: Metadata = { title: "Theme store" };

export default async function ThemeStorePage() {
  const denied = await denyUnless("themes:view");
  if (denied) return denied;

  // The API resolves the tenant from the session, so none is needed here.
  const [themes, previews] = await Promise.all([listThemes(), Promise.all(THEME_PRESETS.map(presetPreview))]);
  const status = (presetId: string) => {
    const owned = themes.filter((t) => t.presetId === presetId);
    return owned.some((t) => t.isLive) ? ("live" as const) : owned.length ? ("installed" as const) : null;
  };

  return (
    <div className="space-y-12">
      <header className="max-w-2xl space-y-3 pt-2">
        <p className="text-sm font-medium text-muted-foreground">Theme store</p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">A beautiful store, ready in minutes</h1>
        <p className="text-muted-foreground">
          Every theme is a complete, mobile-ready store: home page, catalog with filters, product pages with reviews, cart, checkout and
          customer accounts. Pick one, add your logo, and start selling. No design skills needed.
        </p>
      </header>
      <ThemeStoreGrid
        items={THEME_PRESETS.map((preset, i) => ({
          id: preset.id,
          name: preset.name,
          tagline: preset.tagline,
          industries: preset.industries,
          style: preset.style,
          palette: preset.palette,
          status: status(preset.id),
          preview: previews[i],
        }))}
      />
    </div>
  );
}
