import React from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <main className="flex flex-col h-screen overflow-hidden w-full">
      <div className="p-5 bg-white">{children}</div>
    </main>
  );
}
