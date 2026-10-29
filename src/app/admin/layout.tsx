"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Waves,
  LayoutDashboard,
  CalendarDays,
  UserCheck,
  XCircle,
  FileCheck2,
  Droplets,
  Users2,
  BarChart3,
  MessageSquareWarning,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  WifiOff,
  Shield,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!res.ok || !data.authenticated) {
          router.push("/admin/login");
        } else {
          setUser(data.user);
        }
      } catch (err) {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071322] flex items-center justify-center text-slate-300 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Verifying manager credentials...</span>
        </div>
      </div>
    );
  }

  const isOwnerOrAdmin = user?.role === "POOL_OWNER" || user?.role === "SUPER_ADMIN";

  const navigationSections = [
    {
      label: "LIVE OPERATIONS",
      items: [
        { name: "Overview", href: "/admin", icon: LayoutDashboard },
        { name: "Bookings Ledger", href: "/admin/bookings", icon: CalendarDays },
        { name: "Walk-ins & Deck", href: "/admin/walkins", icon: UserCheck },
      ],
    },
    {
      label: "FINANCE & AUDITS",
      items: [
        { name: "Cancellations & Refunds", href: "/admin/cancellations", icon: XCircle },
        { name: "Daily Closing Sheet", href: "/admin/closing", icon: FileCheck2 },
        { name: "Water Quality & Logs", href: "/admin/maintenance", icon: Droplets },
        { name: "Reports & CSV Export", href: "/admin/reports", icon: BarChart3 },
        { name: "Customer Feedback", href: "/admin/complaints", icon: MessageSquareWarning },
      ],
    },
    ...(isOwnerOrAdmin
      ? [
          {
            label: "SYSTEM MANAGEMENT",
            items: [
              { name: "Staff & Permissions", href: "/admin/staff", icon: Users2 },
              { name: "Pool Rules & Rates", href: "/admin/settings", icon: Settings },
              { name: "Offline Sync Engine", href: "/admin/offline", icon: WifiOff },
            ],
          },
        ]
      : [
          {
            label: "SYSTEM TOOLS",
            items: [{ name: "Offline Sync Engine", href: "/admin/offline", icon: WifiOff }],
          },
        ]),
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col lg:flex-row text-slate-900">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-[#0B192C] text-white p-3.5 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-cyan-600 flex items-center justify-center text-white">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs tracking-tight block">M.A.K Operations</span>
            <span className="text-[9px] text-cyan-400 font-mono block">Aluva Ops Portal</span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle Navigation"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Persistent Operations Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0B192C] text-slate-300 flex flex-col justify-between border-r border-slate-800 transform lg:static lg:translate-x-0 transition-transform duration-150 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white shrink-0">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black text-xs text-white block tracking-tight">
                M.A.K INDOOR POOL
              </span>
              <span className="text-[10px] text-cyan-400 font-mono font-semibold tracking-wider uppercase block">
                Manager Control
              </span>
            </div>
          </div>

          {/* Navigation Links with Group Headers */}
          <div className="p-3 space-y-4">
            {navigationSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                  {section.label}
                </span>
                <nav className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-cyan-600 text-white font-semibold shadow-xs"
                            : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? "text-white" : "text-slate-400"
                          }`}
                        />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-800 space-y-2 bg-[#071322]">
          {user && (
            <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/60">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white truncate max-w-[120px]">
                  {user.name}
                </span>
                <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 font-bold uppercase px-1.5 py-0.5 rounded border border-cyan-800/60">
                  {user.role}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {user.phone}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center text-[11px] px-1 pt-0.5">
            <Link
              href="/"
              target="_blank"
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Public Site</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
