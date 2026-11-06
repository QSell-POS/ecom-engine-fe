import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { AuditLogGrid } from "@/components/staff/AuditLogGrid";
import { denyUnless } from "@/lib/api/rbac/access";
import { getAuditLog } from "@/lib/api/rbac/service";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditLogPage() {
  const denied = await denyUnless("staff:manage");
  if (denied) return denied;

  // The latest 100 changes; the API pages beyond that.
  const { data: entries } = await getAuditLog(1, 100);

  return (
    <>
      <PageHeader title="Audit log" description="Who changed staff access, and when. Shows the latest 100 entries." />
      <AuditLogGrid entries={entries} />
    </>
  );
}
