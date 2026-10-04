import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeEditor } from "@/components/theme-editor/ThemeEditor";
import { getCurrentTenant, getTheme } from "@/lib/api/theme";
import { getCatalogApi } from "@/lib/storefront/server";

type Props = { params: Promise<{ themeId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { themeId } = await params;
  const tenant = await getCurrentTenant();
  const theme = await getTheme(tenant.id, themeId);
  return { title: theme ? `Editing ${theme.name}` : "Theme editor" };
}

export default async function ThemeEditorPage({ params }: Props) {
  const { themeId } = await params;
  const tenant = await getCurrentTenant();
  // Scoped to the current tenant: another tenant's theme id 404s.
  const theme = await getTheme(tenant.id, themeId);
  if (!theme) notFound();
  const data = await getCatalogApi({ storeKey: tenant.apiKey, vertical: tenant.vertical, host: tenant.apiKey }).home();

  return (
    <ThemeEditor
      theme={theme}
      tenant={{ name: tenant.name, slug: tenant.slug }}
      isLive={tenant.liveThemeId === theme.id}
      data={data}
      storeInfo={{
        slug: tenant.slug,
        storeKey: tenant.apiKey,
        vertical: tenant.vertical,
        mode: "design",
        basePath: `/store/${tenant.slug}`,
        profile: tenant.profile,
        settings: theme.draft.settings,
      }}
    />
  );
}
