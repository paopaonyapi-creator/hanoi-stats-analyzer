import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { SwRegister } from "@/components/pwa/sw-register";

export const metadata: Metadata = {
  title: "Hanoi Stats Analyzer — เครื่องมือวิเคราะห์ข้อมูลเชิงสถิติ",
  description:
    "ระบบวิเคราะห์ข้อมูลย้อนหลังเชิงสถิติสำหรับฮานอยพิเศษ ฮานอยปกติ และฮานอยวีไอพี พร้อม dashboard, charts, trend scores และ CSV import",
  keywords: ["hanoi", "statistics", "analysis", "data", "trends"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hanoi Lab",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SwRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
