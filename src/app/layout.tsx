import { AppProviders } from "@/components/providers/app-providers";
import { SiteHeader } from "@/components/layout/site-header";
import type { Metadata, Viewport } from "next";
import {
  arabicFontVariableClassName,
  fontTajawal,
} from "@/fonts/arabic";
import "./globals.css";

export const metadata: Metadata = {
  title: "جرّة بطاقات — قوالب تهنئة رقمية",
  description: "تصفّح واشترِ قوالب بطاقات تهنئة رقمية قابلة للتخصيص",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${arabicFontVariableClassName} h-full`}
      suppressHydrationWarning
    >
      <body
        className={`flex min-h-full min-w-0 flex-col antialiased ${fontTajawal.className}`}
      >
        <AppProviders>
          <SiteHeader />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
