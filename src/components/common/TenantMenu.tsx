"use client";

import Link from "next/link";
import { useTransition } from "react";
import { LogOut, UserRound } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { logoutAction } from "@/lib/api/auth/action";
import type { TenantSummary } from "@/lib/api/session";
import { useMe } from "@/components/auth/PermissionsProvider";
import { ROUTES } from "@/lib/constants/routes";

/** Who is signed in, and the way out. */
export function TenantMenu({ tenant }: { tenant: TenantSummary | null }) {
  const [isPending, startTransition] = useTransition();
  const me = useMe();
  const isStaff = me?.kind === "staff";
  // Staff see themselves, with the store underneath; the owner sees the store.
  const name = isStaff ? me.name : (tenant?.name ?? "Your store");
  const subtitle = isStaff ? (me.role ? `${me.role.name} · ${tenant?.name ?? "Store"}` : tenant?.name) : tenant?.email;
  const initial = name.trim().charAt(0).toUpperCase() || "S";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={name}>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[13px] font-semibold">{initial}</span>
              <span className="grid min-w-0 text-left leading-tight">
                <span className="truncate text-sm font-medium">{name}</span>
                {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
              </span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{(isStaff ? me.email : tenant?.email) ?? name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={ROUTES.account}>
                <UserRound />
                Your account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isPending}
              onSelect={(event) => {
                event.preventDefault();
                startTransition(() => {
                  void logoutAction();
                });
              }}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
