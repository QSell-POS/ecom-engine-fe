import React from "react";
import { AdminNavbar } from "@/components/common/AdminNavbar";
import { AdminSidebar } from "@/components/common/AdminSidebar";
import { AppScrollArea } from "@/components/common/AppScrollArea";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getTenantSummary } from "@/lib/api/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Read from the cookie, not /tenant/me: the shell should not wait on the API.
  const tenant = await getTenantSummary();

  return (
    // Fixed-height shell: the window never scrolls, AppScrollArea does.
    // overflow-clip, not hidden: hidden boxes can still be scrolled by
    // scrollIntoView/focus, which would push the navbar out of view.
    <SidebarProvider className="h-dvh min-h-0 overflow-clip">
      <AdminSidebar tenant={tenant} />
      <SidebarInset className="min-h-0 min-w-0 overflow-clip">
        <AdminNavbar />
        <AppScrollArea>
          {/* A master–detail workspace ([data-workspace]) takes the whole area edge to edge. */}
          <div className="group/page mx-auto w-full max-w-7xl px-6 pt-8 pb-16 has-data-workspace:max-w-none has-data-workspace:p-0">
            {children}
          </div>
        </AppScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
