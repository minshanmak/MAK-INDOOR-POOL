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
  Bell,
  ChevronDown,
  User,
} from "lucide-react";
import MakLogo from "@/components/MakLogo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dateStr, setDateStr] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    setDateStr(
      now.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Kolkata",
      })
    );
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
      <div className="min-h-screen bg-[#071322] flex items-center justify-center text-slate-300 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Verifying manager credentials...</span>
        </div>
      </div>
    );
  }

  const isOwnerOrAdmin = user?.role === "POOL_OWNER" || user?.role === "SUPER_ADMIN";

  // Navigation Items exactly matching reference image sidebar
  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Bookings", href: "/admin/bookings", icon: CalendarDays },
    { name: "Customers", href: "/admin/walkins", icon: UserCheck },
    { name: "Payments", href: "/admin/closing", icon: FileCheck2 },
    { name: "Cancellations", href: "/admin/cancellations", icon: XCircle },
    { name: "Maintenance", href: "/admin/maintenance", icon: Droplets },
    { name: "Staff", href: "/admin/staff", icon: Users2 },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
    { name: "Offline Sync", href: "/admin/offline", icon: WifiOff },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row text-slate-900">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-[#0A192F] text-white p-3.5 flex justify-between items-center border-b border-slate-800">
        <MakLogo light={true} />
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
          aria-label="Toggle Navigation"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Persistent Deep Navy Sidebar Matching Reference Image */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#0A192F] text-slate-300 flex flex-col justify-between border-r border-slate-800 transform lg:static lg:translate-x-0 transition-transform duration-150 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="overflow-y-auto">
          {/* Logo Header */}
          <div className="p-4 border-b border-slate-800/80">
            <MakLogo light={true} />
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition duration-150 ${
                    isActive
                      ? "bg-[#00838F] text-white font-bold shadow-xs"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
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

        {/* User Badge & Sign Out in Sidebar Footer */}
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
        {/* Desktop Top Bar Matching Reference Image */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200/90 shadow-2xs">
          {/* Current Date on Left */}
          <div className="text-xs font-medium text-slate-500 font-sans">
            {dateStr || "Saturday, 15 March 2025"}
          </div>

          {/* Right: Notification Bell & Admin Profile Dropdown */}
          <div className="flex items-center gap-4 text-xs">
            {/* Notification Bell */}
            <button
              type="button"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#00838F] rounded-full" />
            </button>

            {/* Admin Profile Dropdown Pill Matching Reference */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-7 h-7 rounded-full bg-[#0A192F] text-cyan-300 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name.slice(0, 1).toUpperCase() : "A"}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-800 text-xs">Admin</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#0A192F] text-white flex items-center justify-center font-bold text-xs">
                  A
                </div>
                <span className="font-bold text-slate-800 text-xs">Admin</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
