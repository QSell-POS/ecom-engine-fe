import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Check, ExternalLink, Store } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/common/PageHeader";
import { StatusLabel } from "@/components/common/StatusLabel";
import { ThemeThumbnail } from "@/components/themes/ThemeThumbnail";
import { CopyButton, InstallThemeButton, StoreSwitcher, ThemeActions } from "@/components/themes/ThemeActions";
import { Button } from "@/components/ui/button";
import { getCurrentTenant, getTheme, listTenants, listThemes, THEME_ROUTES } from "@/lib/api/theme";
import { getPreset, THEME_PRESETS } from "@/lib/theme-engine/presets";
import { cn } from "@/lib/utils";
import { presetPreview, tenantPreview } from "./previews";

export const metadata: Metadata = { title: "Online store" };

const ago = (iso: string | null) => (iso ? formatDistanceToNow(new Date(iso), { addSuffix: true }) : "never");

export default async function ThemesPage() {
  const tenant = await getCurrentTenant();
  const [tenants, themes, preview] = await Promise.all([listTenants(), listThemes(), tenantPreview(tenant)]);
  const live = themes.find((theme) => theme.isLive) ?? null;
  const liveTheme = live ? await getTheme(tenant.id, live.id) : null;
  const library = themes.filter((theme) => !theme.isLive);
  const atLimit = themes.length >= tenant.themeLimit;
  const installedPresets = new Set(themes.map((t) => t.presetId));
  const suggestions = THEME_PRESETS.filter((p) => !installedPresets.has(p.id));
  const suggestionPreviews = live ? [] : await Promise.all(THEME_PRESETS.slice(0, 3).map(presetPreview));

  const { profile } = tenant;
  const presetDefaults = live?.presetId ? getPreset(live.presetId)?.build().settings : undefined;
  const brandChanged = presetDefaults && liveTheme?.published
    ? ["colorPrimary", "fontHeading", "fontBody"].some((key) => liveTheme.published!.settings[key] !== presetDefaults[key])
    : false;
  const checklist = [
    { done: Boolean(profile.logo), label: "Add your logo", hint: "Shown in your header, footer and emails.", anchor: "logo" },
    { done: brandChanged, label: "Pick your brand color and fonts", hint: "Make the theme feel like yours.", anchor: "brand" },
    { done: Boolean(profile.contact.email && profile.contact.phone), label: "Add contact details", hint: "Build trust with a real email and phone number.", anchor: "contact" },
    { done: Object.values(profile.social).some(Boolean), label: "Connect your social accounts", hint: "Linked from your footer.", anchor: "social" },
  ];
  const completed = checklist.filter((item) => item.done).length;

  return (
    <>
      <PageHeader
        title="Online store"
        description={`Choose how ${profile.name} looks, and make it yours in minutes.`}
        actions={
          <>
            <StoreSwitcher tenants={tenants} currentId={tenant.id} />
            {live && (
              <Button variant="outline" asChild>
                <Link href={THEME_ROUTES.storefront(tenant.slug)} target="_blank">
                  View store <ExternalLink />
                </Link>
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-14">
        {live && liveTheme?.published ? (
          <section className="space-y-6">
            <div className="grid overflow-hidden rounded-md border bg-card lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
              <ThemeThumbnail
                document={liveTheme.published}
                data={preview.data}
                store={preview.store}
                href={THEME_ROUTES.storefront(tenant.slug)}
                label="Open your store"
                className="border-b lg:border-r lg:border-b-0"
              />
              <div className="flex flex-col justify-between gap-8 p-6 lg:p-8">
                <div className="space-y-4">
                  <StatusLabel tone="success">Live on your store</StatusLabel>
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">{live.name}</h2>
                    <p className="text-sm text-muted-foreground">Published {ago(live.publishedAt)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Change your logo, colors, fonts and store details in <span className="text-foreground">Customize</span>. Want to rearrange the home page? Use the builder.
                  </p>
                  {live.hasUnpublishedChanges && (
                    <p className="text-sm text-muted-foreground">
                      <StatusLabel tone="warning" className="mr-1.5">Unpublished builder changes</StatusLabel>
                      Publish them from the builder when you&apos;re ready.
                    </p>
                  )}
                </div>
                <ThemeActions
                  themeId={live.id}
                  themeName={live.name}
                  isLive
                  liveThemeName={live.name}
                  atLimit={atLimit}
                  storeSlug={tenant.slug}
                />
              </div>
            </div>

            <div className="rounded-md border bg-card">
              <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
                <div>
                  <h3 className="font-medium">Make it yours</h3>
                  <p className="text-sm text-muted-foreground">A few quick touches before you share your store.</p>
                </div>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {completed} of {checklist.length} done
                </span>
              </div>
              <ul className="divide-y">
                {checklist.map((item) => (
                  <li key={item.label}>
                    <Link href={`${THEME_ROUTES.customize}#${item.anchor}`} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/50">
                      <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border", item.done && "border-success bg-success text-white")}>
                        {item.done && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm font-medium", item.done && "text-muted-foreground line-through decoration-muted-foreground/50")}>{item.label}</span>
                        <span className="block text-xs text-muted-foreground">{item.hint}</span>
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : (
          <section className="space-y-6">
            <div className="rounded-md border bg-card p-8 text-center lg:p-12">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-muted">
                <Store className="size-6" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Pick a theme to launch your store</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                Every theme is a complete store: home page, catalog, product pages, cart, checkout and customer accounts. Choose one and you&apos;re ready to sell. No design work needed.
              </p>
              <Button asChild className="mt-6">
                <Link href={THEME_ROUTES.store}>Browse the theme store</Link>
              </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {THEME_PRESETS.slice(0, 3).map((preset, i) => (
                <article key={preset.id} className="overflow-hidden rounded-md border bg-card">
                  <ThemeThumbnail {...suggestionPreviews[i]} href={THEME_ROUTES.demo(preset.id)} label={`View the ${preset.name} demo store`} className="border-b" />
                  <div className="space-y-4 p-5">
                    <div>
                      <h3 className="font-semibold">{preset.name}</h3>
                      <p className="text-sm text-muted-foreground">{preset.tagline}</p>
                    </div>
                    <div className="flex gap-2">
                      <InstallThemeButton presetId={preset.id} presetName={preset.name} liveThemeName={null} atLimit={atLimit} size="sm" />
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={THEME_ROUTES.storeTheme(preset.id)}>Details</Link>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {library.length > 0 && (
          <section>
            <SectionHeader
              title="Theme library"
              description={`Installed but not live. ${themes.length} of ${tenant.themeLimit} themes used on the ${tenant.plan} plan.`}
            />
            <div className="grid gap-6 md:grid-cols-2">
              {await Promise.all(
                library.map(async (theme) => (
                  <article key={theme.id} className="overflow-hidden rounded-md border bg-card">
                    <ThemeThumbnail document={theme.draft} data={preview.data} store={preview.store} href={THEME_ROUTES.preview(theme.id)} label={`Preview ${theme.name}`} className="border-b" />
                    <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{theme.name}</h3>
                        <p className="text-sm text-muted-foreground">Edited {ago(theme.updatedAt)}</p>
                      </div>
                      <ThemeActions
                        themeId={theme.id}
                        themeName={theme.name}
                        isLive={false}
                        liveThemeName={live?.name ?? null}
                        atLimit={atLimit}
                        storeSlug={tenant.slug}
                      />
                    </div>
                  </article>
                )),
              )}
            </div>
          </section>
        )}

        {live && suggestions.length > 0 && (
          <section>
            <SectionHeader
              title="Explore the theme store"
              description="Complete, ready-to-sell designs. Try any of them on your store before switching."
              actions={
                <Button variant="ghost" asChild>
                  <Link href={THEME_ROUTES.store}>
                    See all themes <ArrowRight />
                  </Link>
                </Button>
              }
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {suggestions.map((preset) => (
                <Link key={preset.id} href={THEME_ROUTES.storeTheme(preset.id)} className="group rounded-md border bg-card p-4 transition-colors hover:border-foreground/30">
                  <div className="mb-4 flex h-16 overflow-hidden rounded-sm border">
                    {preset.palette.map((color, i) => (
                      <span key={i} className="flex-1" style={{ background: color }} />
                    ))}
                  </div>
                  <p className="font-medium">{preset.name}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{preset.tagline}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{preset.industries.join(" · ")}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-md border bg-card p-5">
          <h3 className="text-sm font-medium">Storefront API</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Building a custom or mobile storefront? Use this public key to read your published theme and catalog.
          </p>
          <div className="mt-3 flex items-center gap-1 rounded-sm bg-muted px-3 py-1.5 font-mono text-sm">
            <span className="flex-1 truncate">{tenant.apiKey}</span>
            <CopyButton value={tenant.apiKey} label="Copy API key" />
          </div>
        </section>
      </div>
    </>
  );
}
