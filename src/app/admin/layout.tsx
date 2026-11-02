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
  Calendar,
  Bell,
  ChevronRight,
  User,
  CreditCard,
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
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Bookings", href: "/admin/bookings", icon: CalendarDays },
    { name: "Customers", href: "/admin/customers", icon: User },
    { name: "Walk-ins", href: "/admin/walkins", icon: UserCheck },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Cancellations & Refunds", href: "/admin/cancellations", icon: XCircle },
    { name: "Complaints & Feedback", href: "/admin/complaints", icon: MessageSquareWarning },
    { name: "Maintenance & Water Safety", href: "/admin/maintenance", icon: Droplets },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Daily Closing", href: "/admin/closing", icon: FileCheck2 },
    ...(isOwnerOrAdmin
      ? [
          { name: "Staff & Permissions", href: "/admin/staff", icon: Users2 },
          { name: "System Settings", href: "/admin/settings", icon: Settings },
        ]
      : []),
    { name: "Offline Sync", href: "/admin/offline", icon: WifiOff },
  ];

  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard";
    if (pathname.startsWith("/admin/bookings")) return "Bookings";
    if (pathname.startsWith("/admin/customers")) return "Customers";
    if (pathname.startsWith("/admin/walkins")) return "Walk-ins";
    if (pathname.startsWith("/admin/payments")) return "Payments";
    if (pathname.startsWith("/admin/closing")) return "Daily Closing";
    if (pathname.startsWith("/admin/cancellations")) return "Cancellations & Refunds";
    if (pathname.startsWith("/admin/complaints")) return "Complaints & Feedback";
    if (pathname.startsWith("/admin/maintenance")) return "Maintenance & Water Safety";
    if (pathname.startsWith("/admin/reports")) return "Reports";
    if (pathname.startsWith("/admin/staff")) return "Staff & Permissions";
    if (pathname.startsWith("/admin/settings")) return "System Settings";
    if (pathname.startsWith("/admin/offline")) return "Offline Operations";
    return "Dashboard";
  };

  return (
    <div className="min-h-screen bg-[#EBF2FA] flex flex-col lg:flex-row text-slate-900 font-sans antialiased p-0 lg:p-4 gap-0 lg:gap-4 selection:bg-[#1D68BD] selection:text-white">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md text-slate-900 p-3.5 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1D68BD] flex items-center justify-center text-white shadow-sm">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight block leading-tight">M.A.K Indoor Pool</span>
            <span className="text-[10px] text-slate-500 font-medium block">Ops Manager</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {livePoolClock.time && (
            <div className="text-right bg-slate-100 px-2.5 py-1 rounded-full">
              <span className="text-[10px] text-slate-700 font-mono font-bold block leading-none">{livePoolClock.time}</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Floating White Rounded Sidebar (Exact Mockup Match) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-xl lg:rounded-3xl p-4 flex flex-col justify-between border border-white/80 shadow-[0_10px_35px_rgba(20,60,110,0.06)] transform lg:static lg:translate-x-0 transition-transform duration-200 ease-out shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-2 mb-3 border-b border-slate-100/90 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1D68BD] flex items-center justify-center text-white shadow-md shadow-blue-600/25 shrink-0">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-sm text-slate-900 leading-tight block tracking-tight">M.A.K</span>
              <span className="font-bold text-xs text-slate-700 leading-tight block">Indoor Pool</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all active:scale-[0.98] ${
                    isActive
                      ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.name === "Complaints & Feedback" && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Developed by MishGa Footer */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          {user && (
            <div className="bg-slate-50/90 rounded-2xl p-2.5 border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : "O"}
                </div>
                <div className="text-left overflow-hidden">
                  <span className="font-bold text-xs text-slate-900 block truncate leading-tight">{user.name || "Pool Owner"}</span>
                  <span className="text-[10px] text-slate-400 block leading-tight capitalize">{user.role === "POOL_OWNER" ? "Owner" : user.role || "Staff"}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          )}

          <div className="flex justify-between items-center text-[11px] px-1 pt-1 text-slate-500">
            <Link
              href="/"
              target="_blank"
              className="hover:text-slate-900 flex items-center gap-1 transition font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </Link>
            <button
              onClick={handleLogout}
              className="text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 transition active:scale-95"
            >
              <LogOut className="w-3 h-3" />
              Logout
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Developed by{" "}
            <a
              href="https://mishga.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1D68BD] hover:underline font-bold transition-colors"
            >
              MishGa
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar (from mockup) */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pt-1 px-4 sm:px-0">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{getPageTitle()}</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">M.A.K Indoor Pool Management</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Date Pill */}
            <div className="bg-white rounded-full px-4 py-2 border border-slate-200/80 shadow-2xs flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{livePoolClock.date || "Today"}</span>
            </div>

            {/* Pool Operational Status Pill */}
            <div className="bg-[#E8F8F0] text-emerald-700 border border-emerald-200/80 rounded-full px-3.5 py-2 text-xs font-bold shadow-2xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pool Operational</span>
            </div>

            {/* Notifications Bell */}
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center relative text-slate-600 hover:text-slate-900 cursor-pointer transition">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 w-full px-4 sm:px-0 pb-6">{children}</main>
      </div>
    </div>
  );
}
