import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Hanoi Stats Analyzer — เครื่องมือวิเคราะห์ข้อมูลเชิงสถิติ",
  description:
    "ระบบวิเคราะห์ข้อมูลย้อนหลังเชิงสถิติสำหรับฮานอยพิเศษ ฮานอยปกติ และฮานอยวีไอพี พร้อม dashboard, charts, trend scores และ CSV import",
  keywords: ["hanoi", "statistics", "analysis", "data", "trends"],
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
