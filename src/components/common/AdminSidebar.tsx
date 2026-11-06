"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NAV_GROUPS, navItemForPath } from "@/lib/constants/nav";
import type { TenantSummary } from "@/lib/api/session";
import { useCanFn } from "@/components/auth/PermissionsProvider";
import { TenantMenu } from "./TenantMenu";

export function AdminSidebar({ tenant }: { tenant: TenantSummary | null }) {
  const pathname = usePathname();
  const active = navItemForPath(pathname);
  const can = useCanFn();
  // Only what this admin can open; a group with nothing left is dropped.
  const groups = NAV_GROUPS.map((group) => ({ ...group, items: group.items.filter((item) => !item.permission || can(item.permission)) })).filter(
    (group) => group.items.length > 0,
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center px-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-[13px] font-semibold text-primary-foreground">
            E
          </span>
          <span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Ecom Engine
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="gap-0 pt-1">
        {groups.map((group, index) => (
          <SidebarGroup key={group.label ?? index} className="py-1.5">
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={active?.href === item.href} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <TenantMenu tenant={tenant} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
