import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Can } from "@/components/auth/PermissionsProvider";
import { AddStaffButton } from "@/components/staff/StaffDialog";
import { StaffGrid } from "@/components/staff/StaffGrid";
import { Button } from "@/components/ui/button";
import { denyUnless } from "@/lib/api/rbac/access";
import { RBAC_ROUTES } from "@/lib/api/rbac/constants";
import { getRoles, getStaff } from "@/lib/api/rbac/service";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const denied = await denyUnless("staff:view");
  if (denied) return denied;

  const [staff, roles] = await Promise.all([getStaff(), getRoles()]);

  return (
    <>
      <PageHeader
        title="Staff"
        description="Everyone who can sign in to this dashboard, and what their role lets them do. You, the owner, always have full access."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={RBAC_ROUTES.roles}>
                <ShieldCheck /> Roles
              </Link>
            </Button>
            <Can I="staff:manage">
              <AddStaffButton roles={roles} />
            </Can>
          </>
        }
      />
      <StaffGrid staff={staff} roles={roles} />
    </>
  );
}
