"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  List,
  Upload,
  BarChart3,
  TrendingUp,
  Settings,
  Activity,
  Menu,
  X,
  Brain,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/prediction", label: "AI Prediction", icon: Brain },
  { href: "/results", label: "ผลย้อนหลัง", icon: List },
  { href: "/import", label: "นำเข้าข้อมูล", icon: Upload },
  { href: "/analysis", label: "วิเคราะห์สถิติ", icon: BarChart3 },
  { href: "/analysis/search", label: "เจาะลึกเลขเด็ด", icon: Database },
  { href: "/analysis/calendar", label: "Lucky Calendar", icon: Calendar },
  { href: "/analysis/heatmap", label: "Heatmap", icon: Activity },
  { href: "/analysis/simulation", label: "AI Simulation Lab", icon: Zap },
  { href: "/analysis/broadcast", label: "Broadcast TV (LIVE)", icon: Tv },
  { href: "/trend-score", label: "Trend Score", icon: TrendingUp },
  { href: "/truth", label: "Truth Engine", icon: Brain },
  { href: "/settings", label: "Notifications & ตั้งค่า", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--text-primary)]">
                Hanoi Stats
              </h1>
              <p className="text-[10px] text-[var(--text-muted)]">
                Statistical Analyzer
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            เครื่องมือวิเคราะห์ข้อมูลเชิงสถิติ
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content flex-1 md:ml-[260px]">
        {/* Top bar for mobile */}
        <div className="md:hidden flex items-center gap-3 p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-[var(--bg-card)]"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <span className="font-semibold text-sm">Hanoi Stats Analyzer</span>
        </div>

        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
