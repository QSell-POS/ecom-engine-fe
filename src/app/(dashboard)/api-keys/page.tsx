import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { ApiKeysGrid } from "@/components/api-key/ApiKeysGrid";
import { CreateApiKeyButton } from "@/components/api-key/ApiKeyDialog";
import { getApiKeys } from "@/lib/api/api-key/service";
import { denyUnless } from "@/lib/api/rbac/access";

export const metadata: Metadata = { title: "API keys" };

export default async function ApiKeysPage() {
  const denied = await denyUnless("api_keys:manage");
  if (denied) return denied;

  const { data: keys } = await getApiKeys({ limit: 100 });

  return (
    <>
      <PageHeader
        title="API keys"
        description="Keys your storefronts use to read the catalog. The secret is shown once, when you create it."
        actions={<CreateApiKeyButton />}
      />
      <ApiKeysGrid keys={keys} />
    </>
  );
}
