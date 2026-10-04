import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ExternalLink } from "lucide-react";
import { InstallThemeButton } from "@/components/themes/ThemeActions";
import { ThemeDevicePreview } from "@/components/themes/ThemeDevicePreview";
import { Button } from "@/components/ui/button";
import { getCurrentTenant, listThemes, THEME_ROUTES } from "@/lib/api/theme";
import { getPreset, THEME_PRESETS } from "@/lib/theme-engine/presets";
import { FONTS } from "@/lib/theme-engine/schema";
import { presetPreview } from "../../previews";

type Props = { params: Promise<{ presetId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const preset = getPreset((await params).presetId);
  return { title: preset ? `${preset.name} theme` : "Theme" };
}

const PAGES = [
  "Home page with ready-made sections",
  "Catalog with category, brand, price and rating filters",
  "Search and sorting",
  "Product pages with image gallery, variants and reviews",
  "Slide-out cart and full cart page",
  "Checkout with saved addresses",
  "Customer accounts, order history and tracking",
  "Wishlist",
];

export default async function ThemeDetailPage({ params }: Props) {
  const preset = getPreset((await params).presetId);
  if (!preset) notFound();
  const tenant = await getCurrentTenant();
  const [themes, preview] = await Promise.all([listThemes(), presetPreview(preset)]);
  const live = themes.find((t) => t.isLive) ?? null;
  const isLive = live?.presetId === preset.id;
  const settings = preview.document.settings;
  const others = THEME_PRESETS.filter((p) => p.id !== preset.id);

  return (
    <div className="space-y-12">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={THEME_ROUTES.store}>
          <ArrowLeft /> Theme store
        </Link>
      </Button>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        <div className="min-w-0 space-y-10">
          <header className="space-y-3">
            <p className="text-sm text-muted-foreground">{preset.industries.join(" · ")}</p>
            <h1 className="text-4xl font-semibold tracking-tight">{preset.name}</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">{preset.tagline}</p>
          </header>
          <ThemeDevicePreview {...preview} href={THEME_ROUTES.demo(preset.id)} />
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">About this theme</h2>
            <p className="max-w-2xl leading-relaxed text-muted-foreground">{preset.description}</p>
          </section>
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">A complete store, out of the box</h2>
            <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {PAGES.map((page) => (
                <li key={page} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" /> {page}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <div className="space-y-4 rounded-md border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold">Free</span>
              <span className="text-xs text-muted-foreground">Included in every plan</span>
            </div>
            {isLive ? (
              <Button asChild className="w-full">
                <Link href={THEME_ROUTES.customize}>Customize your store</Link>
              </Button>
            ) : (
              <InstallThemeButton
                presetId={preset.id}
                presetName={preset.name}
                liveThemeName={live?.name ?? null}
                atLimit={themes.length >= tenant.themeLimit}
                className="w-full"
              />
            )}
            <Button variant="outline" asChild className="w-full">
              <Link href={THEME_ROUTES.demo(preset.id)} target="_blank">
                View demo store <ExternalLink />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              {isLive
                ? "This is your live theme."
                : "Your store goes live with this theme right away. Your logo, contact details and social links carry over."}
            </p>
          </div>

          <div className="space-y-5 rounded-md border bg-card p-5 text-sm">
            <div className="space-y-2">
              <h3 className="font-medium">Highlights</h3>
              <ul className="space-y-1.5 text-muted-foreground">
                {preset.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Colors</h3>
              <div className="flex overflow-hidden rounded-sm border">
                {preset.palette.map((color, i) => (
                  <span key={i} title={color} className="h-9 flex-1" style={{ background: color }} />
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">Fonts</h3>
              <p className="text-muted-foreground">
                <span style={{ fontFamily: FONTS[String(settings.fontHeading)]?.stack }} className="text-base text-foreground">
                  {FONTS[String(settings.fontHeading)]?.label}
                </span>{" "}
                for headings, {FONTS[String(settings.fontBody)]?.label} for text
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">Style</h3>
              <p className="text-muted-foreground">{preset.style.join(", ")}</p>
            </div>
          </div>
        </aside>
      </div>

      <section className="space-y-4 border-t pt-10">
        <h2 className="text-lg font-semibold">More themes</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {others.map((other) => (
            <Link key={other.id} href={THEME_ROUTES.storeTheme(other.id)} className="rounded-md border bg-card p-4 transition-colors hover:border-foreground/30">
              <div className="mb-3 flex h-12 overflow-hidden rounded-sm border">
                {other.palette.map((color, i) => (
                  <span key={i} className="flex-1" style={{ background: color }} />
                ))}
              </div>
              <p className="font-medium">{other.name}</p>
              <p className="line-clamp-1 text-sm text-muted-foreground">{other.tagline}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
