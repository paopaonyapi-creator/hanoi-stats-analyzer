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
  Database,
  Calendar,
  Tv,
  Zap,
  Info,
  FlaskConical,
  Search,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/prediction", label: "AI Prediction", icon: Brain, exact: true },
      { href: "/results", label: "ผลย้อนหลัง", icon: List, exact: true },
      { href: "/import", label: "นำเข้าข้อมูล", icon: Upload, exact: true },
    ],
  },
  {
    title: "Analysis",
    items: [
      { href: "/analysis", label: "วิเคราะห์สถิติ", icon: BarChart3, exact: true },
      { href: "/analysis/search", label: "เจาะลึกเลขเด็ด", icon: Search },
      { href: "/analysis/calendar", label: "Lucky Calendar", icon: Calendar },
      { href: "/analysis/heatmap", label: "Heatmap", icon: Activity },
      { href: "/analysis/simulation", label: "AI Simulation Lab", icon: Zap },
      { href: "/analysis/broadcast", label: "Broadcast TV (LIVE)", icon: Tv },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/trend-score", label: "Trend Score", icon: TrendingUp },
      { href: "/truth", label: "Truth Engine", icon: FlaskConical },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/settings", label: "Notifications & ตั้งค่า", icon: Settings },
      { href: "/manual", label: "คู่มือการใช้งาน", icon: Info },
    ],
  },
];

function isNavActive(itemHref: string, pathname: string, exact?: boolean) {
  if (exact) return pathname === itemHref;
  return pathname === itemHref || pathname.startsWith(itemHref + "/");
}

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
            <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.4)]">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Hanoi Stats
              </h2>
              <p className="text-[10px] text-[var(--text-muted)]">
                Intelligence Platform
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mb-4">
              <p className="px-4 mb-1 text-[9px] font-black uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-60">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isNavActive(item.href, pathname, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`sidebar-link ${active ? "active" : ""}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {active && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] flex-shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
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
        <div className="sticky top-0 z-20 md:hidden flex items-center gap-3 p-4 border-b border-[var(--border-color)] bg-[rgba(10,15,30,0.92)] backdrop-blur">
          <button
            id="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-[var(--bg-card)]"
            aria-label="Toggle menu"
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
