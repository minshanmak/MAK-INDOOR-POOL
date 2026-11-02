"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { formatPoolDate, formatPoolTime } from "@/lib/timezone";
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
  const [livePoolClock, setLivePoolClock] = useState({ date: "", time: "" });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLivePoolClock({
        date: formatPoolDate(now),
        time: formatPoolTime(now, true),
      });
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="min-h-screen bg-[#071322] flex items-center justify-center text-slate-300 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating operations session...</span>
        </div>
      </div>
    );
  }

  const isOwnerOrAdmin = user?.role === "POOL_OWNER" || user?.role === "SUPER_ADMIN";

  const navigation = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard, color: "from-blue-500 to-indigo-600" },
    { name: "Bookings & Calendar", href: "/admin/bookings", icon: CalendarDays, color: "from-indigo-500 to-purple-600" },
    { name: "Walk-ins & Occupancy", href: "/admin/walkins", icon: UserCheck, color: "from-cyan-500 to-teal-600" },
    { name: "Cancellations & Refunds", href: "/admin/cancellations", icon: XCircle, color: "from-rose-500 to-red-600" },
    { name: "Daily Closing", href: "/admin/closing", icon: FileCheck2, color: "from-emerald-500 to-teal-600" },
    { name: "Maintenance & Water", href: "/admin/maintenance", icon: Droplets, color: "from-sky-500 to-cyan-600" },
    { name: "Reports & Exports", href: "/admin/reports", icon: BarChart3, color: "from-amber-500 to-orange-600" },
    { name: "Complaints & Reviews", href: "/admin/complaints", icon: MessageSquareWarning, color: "from-fuchsia-500 to-pink-600" },
    ...(isOwnerOrAdmin
      ? [
          { name: "Staff & Permissions", href: "/admin/staff", icon: Users2, color: "from-slate-600 to-slate-800" },
          { name: "System Settings", href: "/admin/settings", icon: Settings, color: "from-zinc-500 to-zinc-700" },
        ]
      : []),
    { name: "Offline Sync", href: "/admin/offline", icon: WifiOff, color: "from-sky-600 to-blue-700" },
  ];

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col lg:flex-row text-slate-900 font-sans antialiased selection:bg-cyan-500 selection:text-white">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-[#18181B]/95 backdrop-blur-xl text-white p-3.5 flex justify-between items-center border-b border-white/[0.08] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block leading-tight">M.A.K Ops</span>
            <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase block">Pool Manager</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {livePoolClock.time && (
            <div className="text-right bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-full">
              <span className="text-[10px] text-cyan-400 font-mono font-bold block leading-none">{livePoolClock.time}</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-slate-200 transition active:scale-95"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Persistent Operations Sidebar (macOS / iPadOS frosted aesthetic) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#18181B]/95 backdrop-blur-2xl text-slate-300 flex flex-col justify-between border-r border-white/[0.08] shadow-2xl lg:shadow-none transform lg:static lg:translate-x-0 transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.08] flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-xs text-white block tracking-tight">
                M.A.K INDOOR POOL
              </span>
              <span className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase block">
                Ops Manager
              </span>
            </div>
          </div>

          {/* Live IST Pool Clock (Dynamic Island / Watch Tile) */}
          {livePoolClock.time && (
            <div className="mx-3 mt-3 px-3 py-2 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-between text-[11px] shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider">Live IST</span>
              </div>
              <div className="text-right">
                <div className="text-white font-mono font-bold tabular-nums text-xs leading-none">{livePoolClock.time}</div>
                <div className="text-[9px] text-slate-400 font-mono leading-tight mt-0.5">{livePoolClock.date}</div>
              </div>
            </div>
          )}

          {/* Navigation Links with iOS App Icon Squircle Badges */}
          <nav className="p-3 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.98] ${
                    isActive
                      ? "bg-white/[0.14] text-white font-semibold shadow-xs ring-1 ring-white/10"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white shrink-0 shadow-2xs`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout (Apple Inset Card) */}
        <div className="p-3 border-t border-white/[0.08] space-y-2.5">
          {user && (
            <div className="bg-white/[0.05] p-2.5 rounded-2xl border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white truncate">{user.name}</span>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-bold uppercase px-2 py-0.5 rounded-full border border-cyan-500/30">
                  {user.role}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{user.phone}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-[11px] px-1">
            <Link
              href="/"
              target="_blank"
              className="text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Website
            </Link>
            <button
              onClick={handleLogout}
              className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
          <div className="pt-2 border-t border-white/[0.06] text-center text-[10px] text-slate-500">
            Developed by{" "}
            <a
              href="https://mishga.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 transition-colors"
            >
              MishGa
            </a>
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
