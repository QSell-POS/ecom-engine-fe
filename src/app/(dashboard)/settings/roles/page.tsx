import type { Metadata } from "next";
import Link from "next/link";
import { UserCog } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { RolesList } from "@/components/staff/RolesList";
import { Button } from "@/components/ui/button";
import { denyUnless } from "@/lib/api/rbac/access";
import { RBAC_ROUTES } from "@/lib/api/rbac/constants";
import { getRoles } from "@/lib/api/rbac/service";

export const metadata: Metadata = { title: "Roles" };

export default async function RolesPage() {
  const denied = await denyUnless("staff:view");
  if (denied) return denied;

  const roles = await getRoles();

  return (
    <>
      <PageHeader
        title="Roles"
        description="A role is a set of permissions you give to staff. Need one exception for one person? Use Custom permissions on the Staff page instead of a new role."
        actions={
          <Button variant="outline" asChild>
            <Link href={RBAC_ROUTES.staff}>
              <UserCog /> Staff
            </Link>
          </Button>
        }
      />
      <RolesList roles={roles} />
    </>
  );
}
