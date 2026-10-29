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
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // If on /admin/login, don't check session or render sidebar
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-lagoon-400 border-t-transparent rounded-full animate-spin" />
          <span>Loading management session...</span>
        </div>
      </div>
    );
  }

  const isOwnerOrAdmin = user?.role === "POOL_OWNER" || user?.role === "SUPER_ADMIN";

  const navigation = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Bookings & Calendar", href: "/admin/bookings", icon: CalendarDays },
    { name: "Walk-ins & Occupancy", href: "/admin/walkins", icon: UserCheck },
    { name: "Cancellations & Refunds", href: "/admin/cancellations", icon: XCircle },
    { name: "Daily Closing", href: "/admin/closing", icon: FileCheck2 },
    { name: "Maintenance & Water", href: "/admin/maintenance", icon: Droplets },
    { name: "Reports & Exports", href: "/admin/reports", icon: BarChart3 },
    { name: "Complaints & Reviews", href: "/admin/complaints", icon: MessageSquareWarning },
    ...(isOwnerOrAdmin
      ? [
          { name: "Staff & Permissions", href: "/admin/staff", icon: Users2 },
          { name: "System Settings", href: "/admin/settings", icon: Settings },
        ]
      : []),
    { name: "Offline Sync", href: "/admin/offline", icon: WifiOff },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Waves className="w-5 h-5 text-lagoon-400" />
          <span className="font-extrabold text-sm">M.A.K Pool Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Persistent Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transform lg:static lg:translate-x-0 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-lagoon-500 to-ocean-500 flex items-center justify-center text-white shadow-lg shadow-ocean-950/60">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white block leading-tight">M.A.K Indoor Pool</span>
              <span className="text-[10px] text-lagoon-400 uppercase tracking-widest font-bold">Ops Dashboard</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-ocean-600 text-white shadow-md shadow-ocean-900/40"
                      : "hover:bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-3">
          {user && (
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-ocean-800 border border-ocean-700 flex items-center justify-center text-white font-bold text-xs uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <span className="font-bold text-xs text-white block truncate">{user.name}</span>
                <span className="text-[10px] bg-slate-800 text-lagoon-300 font-extrabold uppercase px-1.5 py-0.2 rounded">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <Link
              href="/"
              target="_blank"
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-[11px]"
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 font-semibold text-[11px]"
            >
              <LogOut className="w-3 h-3" />
              Sign Out
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
