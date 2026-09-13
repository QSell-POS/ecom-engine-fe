import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen w-full flex-col overflow-y-auto bg-slate-50">
      <div className="p-5">{children}</div>
    </main>
  );
}
