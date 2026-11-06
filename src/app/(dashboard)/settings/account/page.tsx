import type { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { ChangePasswordForm } from "@/components/staff/ChangePasswordForm";
import { PermissionMatrix } from "@/components/staff/PermissionMatrix";
import { getMe } from "@/lib/api/rbac/service";
import { getTenantSummary } from "@/lib/api/session";

export const metadata: Metadata = { title: "Your account" };

export default async function AccountPage() {
  const [me, tenant] = await Promise.all([getMe(), getTenantSummary()]);
  const isStaff = me?.kind === "staff";

  return (
    <>
      <PageHeader title="Your account" description={isStaff ? `Your sign-in for ${tenant?.name ?? "this store"}.` : "Your sign-in as the store owner."} />
      <div className="space-y-12">
        <section className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Name: </span>
            {isStaff ? me.name : tenant?.name}
          </p>
          <p>
            <span className="text-muted-foreground">Email: </span>
            {isStaff ? me.email : (me?.email || tenant?.email)}
          </p>
          <p>
            <span className="text-muted-foreground">Access: </span>
            {isStaff ? (me.role?.name ?? "No role") : "Owner, with full access"}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold">Change password</h2>
          <ChangePasswordForm />
        </section>

        {isStaff && (
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">What you can do</h2>
              <p className="text-sm text-muted-foreground">Set by your role and any custom permissions. Ask the store owner if you need more.</p>
            </div>
            <PermissionMatrix value={new Set(me.permissions)} readOnly />
          </section>
        )}
      </div>
    </>
  );
}
