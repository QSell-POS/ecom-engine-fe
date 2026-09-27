import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fontVariables } from "@/lib/fonts";

export const metadata: Metadata = {
  title: { default: "Ecom Engine", template: "%s · Ecom Engine" },
  description: "Commerce admin and storefront builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="font-sans">
        <TooltipProvider delayDuration={400} skipDelayDuration={200}>
          {children}
        </TooltipProvider>
        <Toaster theme="light" position="bottom-center" />
      </body>
    </html>
  );
}
