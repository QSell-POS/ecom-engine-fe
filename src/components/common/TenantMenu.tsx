"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { logoutAction } from "@/lib/api/auth/action";
import type { TenantSummary } from "@/lib/api/session";

/** Who is signed in, and the way out. */
export function TenantMenu({ tenant }: { tenant: TenantSummary | null }) {
  const [isPending, startTransition] = useTransition();
  const name = tenant?.name ?? "Your store";
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
                {tenant?.email && <span className="truncate text-xs text-muted-foreground">{tenant.email}</span>}
              </span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{tenant?.email ?? name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
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
