"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { navItemForPath } from "@/lib/constants/nav";

const SUBPAGE_LABELS: Record<string, string> = { create: "New", edit: "Edit" };

export function AdminNavbar() {
  const pathname = usePathname();
  const section = navItemForPath(pathname);
  const leaf = pathname.split("/").filter(Boolean).at(-1) ?? "";
  const subpage = section && pathname !== section.href ? SUBPAGE_LABELS[leaf] : undefined;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1 text-muted-foreground" />
      <Separator orientation="vertical" className="h-4!" />
      <Breadcrumb>
        <BreadcrumbList>
          {section && (
            <BreadcrumbItem>
              {subpage ? (
                <BreadcrumbLink asChild>
                  <Link href={section.href}>{section.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{section.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          )}
          {subpage && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{subpage}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
