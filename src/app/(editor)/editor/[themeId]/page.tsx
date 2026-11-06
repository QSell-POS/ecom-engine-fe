import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThemeEditor } from "@/components/theme-editor/ThemeEditor";
import { getCurrentTenant, getTheme } from "@/lib/api/theme";
import { getCatalogApi } from "@/lib/storefront/server";
import { denyUnless } from "@/lib/api/rbac/access";

type Props = { params: Promise<{ themeId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { themeId } = await params;
  const tenant = await getCurrentTenant();
  const theme = await getTheme(tenant.id, themeId);
  return { title: theme ? `Editing ${theme.name}` : "Theme editor" };
}

export default async function ThemeEditorPage({ params }: Props) {
  // Outside the dashboard shell, so the guard renders on its own page.
  const denied = await denyUnless("themes:edit");
  if (denied) return <div className="mx-auto max-w-3xl p-8">{denied}</div>;

  const { themeId } = await params;
  const tenant = await getCurrentTenant();
  // Scoped to the current tenant: another tenant's theme id 404s.
  const theme = await getTheme(tenant.id, themeId);
  if (!theme) notFound();
  // Design with demo content rather than lose the builder if the catalog can't be read.
  const data = await getCatalogApi({ storeKey: tenant.apiKey, vertical: tenant.vertical, host: tenant.apiKey })
    .home()
    .catch(async (error: unknown) => {
      console.error(`Theme editor: catalog for ${tenant.apiKey} failed, using demo content.`, error);
      return getCatalogApi({ storeKey: "demo", vertical: tenant.vertical }).home();
    });

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
