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
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row text-slate-900">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-[#0B192C] text-white p-3.5 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-cyan-600 flex items-center justify-center text-white">
            <Waves className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight">M.A.K Operations</span>
        </div>
        <div className="flex items-center gap-3">
          {livePoolClock.time && (
            <div className="text-right">
              <span className="text-[10px] text-cyan-400 font-mono font-bold block">{livePoolClock.time}</span>
              <span className="text-[9px] text-slate-400 font-mono block">{livePoolClock.date}</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Persistent Operations Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#0B192C] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 transform lg:static lg:translate-x-0 transition-transform duration-150 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Header */}
          <div className="p-4 border-b border-slate-800/80 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-xs text-white block tracking-tight">
                M.A.K INDOOR POOL
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold tracking-wider uppercase block">
                Ops Manager
              </span>
            </div>
          </div>

          {/* Live IST Pool Clock */}
          {livePoolClock.time && (
            <div className="mx-3 mt-3 px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-800/90 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-cyan-400 text-[10px] font-sans font-bold uppercase tracking-wider">Pool Clock</span>
              </div>
              <div className="text-right">
                <div className="text-white font-bold tabular-nums text-xs leading-none">{livePoolClock.time}</div>
                <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{livePoolClock.date}</div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-2 space-y-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-cyan-600 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          {user && (
            <div className="bg-slate-850 px-2.5 py-2 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white truncate">{user.name}</span>
                <span className="text-[9px] bg-slate-800 text-cyan-300 font-bold uppercase px-1.5 py-0.5 rounded">
                  {user.role}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">{user.phone}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-[11px] px-1 pt-1">
            <Link
              href="/"
              target="_blank"
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </Link>
            <button
              onClick={handleLogout}
              className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Logout
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
