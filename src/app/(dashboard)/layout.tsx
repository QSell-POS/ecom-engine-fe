import React from "react";
import { AdminNavbar } from "@/components/common/AdminNavbar";
import { AdminSidebar } from "@/components/common/AdminSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <div className="flex w-full h-svh flex-col">
        <AdminNavbar />
        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <main className="flex min-h-full flex-col">
            <div className="p-5">{children}</div>
          </main>
        </ScrollArea>
      </div>
    </SidebarProvider>
  );
}
