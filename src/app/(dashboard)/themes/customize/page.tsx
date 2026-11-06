import type { Metadata } from "next";
import Link from "next/link";
import { Store } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StoreCustomizer } from "@/components/themes/StoreCustomizer";
import { Button } from "@/components/ui/button";
import { getCurrentTenant, getTheme, THEME_ROUTES } from "@/lib/api/theme";
import { tenantPreview } from "../previews";
import { paletteFromSettings } from "@/components/themes/palette";
import { denyUnless } from "@/lib/api/rbac/access";

export const metadata: Metadata = { title: "Customize your store" };

export default async function CustomizePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const denied = await denyUnless("themes:view");
  if (denied) return denied;

  const tenant = await getCurrentTenant();
  const live = tenant.liveThemeId ? await getTheme(tenant.id, tenant.liveThemeId) : null;

  if (!live?.published) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-md bg-muted">
          <Store className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Choose a theme first</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pick a ready-made theme and your store is live. Then come back here to add your logo, colors and details.</p>
        <Button asChild className="mt-6">
          <Link href={THEME_ROUTES.store}>Browse the theme store</Link>
        </Button>
      </div>
    );
  }

  const { data, store } = await tenantPreview(tenant);
  const settings = live.published.settings;

  return (
    <>
      <PageHeader title="Customize your store" description="Your logo, colors, fonts and store details. Changes go live when you save." />
      <StoreCustomizer
        initialProfile={tenant.profile}
        initialBrand={{
          ...paletteFromSettings(settings),
          colorPrimary: String(settings.colorPrimary),
          colorPrimaryText: String(settings.colorPrimaryText),
          fontHeading: String(settings.fontHeading),
          fontBody: String(settings.fontBody),
        }}
        themeId={live.id}
        themeName={live.name}
        document={live.published}
        data={data}
        store={{ ...store, mode: "design" }}
        welcome={(await searchParams).welcome === "1"}
      />
    </>
  );
}
