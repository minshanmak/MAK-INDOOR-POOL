"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { formatPoolDate, formatPoolTime } from "@/lib/timezone";
import MakLogo from "@/components/MakLogo";
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
  ChevronDown,
  User,
  CreditCard,
  QrCode,
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
          const currentUrl = typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/admin";
          router.push(`/admin/login?redirect=${encodeURIComponent(currentUrl)}`);
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
      <div className="min-h-screen bg-[#EBF2FA] flex items-center justify-center text-slate-500 text-xs font-semibold">
        <div className="flex items-center gap-2.5 bg-white px-5 py-3 rounded-2xl shadow-sm border border-white">
          <div className="w-4 h-4 border-2 border-[#1D68BD] border-t-transparent rounded-full animate-spin" />
          <span>Authenticating operations session...</span>
        </div>
      </div>
    );
  }

  const isOwnerOrAdmin = user?.role === "POOL_OWNER" || user?.role === "SUPER_ADMIN";

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Bookings", href: "/admin/bookings", icon: CalendarDays, hasSubmenu: true },
    { name: "Customers", href: "/admin/customers", icon: User },
    { name: "Walk-ins", href: "/admin/walkins", icon: UserCheck },
    { name: "QR Scanner", href: "/admin/scan", icon: QrCode },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Cancellations & Refunds", href: "/admin/cancellations", icon: XCircle },
    { name: "Complaints & Feedback", href: "/admin/complaints", icon: MessageSquareWarning },
    { name: "Maintenance", href: "/admin/maintenance", icon: Droplets },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    ...(isOwnerOrAdmin
      ? [
          { name: "Staff & Permissions", href: "/admin/staff", icon: Users2 },
          { name: "Notifications", href: "/admin/complaints", icon: Bell, badge: 3 },
          { name: "System Settings", href: "/admin/settings", icon: Settings },
        ]
      : [
          { name: "Notifications", href: "/admin/complaints", icon: Bell, badge: 3 },
        ]),
    { name: "Daily Closing", href: "/admin/closing", icon: FileCheck2 },
    { name: "Offline Sync", href: "/admin/offline", icon: WifiOff },
  ];

  const getPageHeaderInfo = () => {
    if (pathname === "/admin") {
      return {
        title: "Dashboard",
        subtitle: "M.A.K Indoor Pool Management",
      };
    }
    if (pathname.startsWith("/admin/bookings")) {
      return {
        title: "Bookings",
        subtitle: "Manage public and family bookings",
      };
    }
    if (pathname.startsWith("/admin/customers")) {
      return {
        title: "Customers",
        subtitle: "Manage customer profiles and booking history",
      };
    }
    if (pathname.startsWith("/admin/walkins")) {
      return {
        title: "Walk-ins",
        subtitle: "Record and manage walk-in visitors",
      };
    }
    if (pathname.startsWith("/admin/scan")) {
      return {
        title: "QR Admission Scanner",
        subtitle: "Instant mobile admission and counter balance check",
      };
    }
    if (pathname.startsWith("/admin/payments")) {
      return {
        title: "Payments",
        subtitle: "Track and manage all payments",
      };
    }
    if (pathname.startsWith("/admin/cancellations")) {
      return {
        title: "Cancellations & Refunds",
        subtitle: "Manage cancellation requests and refund processing",
      };
    }
    if (pathname.startsWith("/admin/complaints")) {
      return {
        title: "Complaints & Feedback",
        subtitle: "Log and resolve customer issues and moderate feedback",
      };
    }
    if (pathname.startsWith("/admin/maintenance")) {
      return {
        title: "Maintenance & Water Safety",
        subtitle: "Daily maintenance, water quality and safety checks",
      };
    }
    if (pathname.startsWith("/admin/reports")) {
      return {
        title: "Reports",
        subtitle: "Business reports and analytics",
      };
    }
    if (pathname.startsWith("/admin/closing")) {
      return {
        title: "Daily Closing",
        subtitle: "End-of-day register balancing and cash reconciliation",
      };
    }
    if (pathname.startsWith("/admin/staff")) {
      return {
        title: "Staff & Permissions",
        subtitle: "Manage staff accounts and their access permissions",
      };
    }
    if (pathname.startsWith("/admin/settings")) {
      return {
        title: "System Settings",
        subtitle: "Configure pool operations, pricing and system preferences",
      };
    }
    if (pathname.startsWith("/admin/offline")) {
      return {
        title: "Offline Operations",
        subtitle: "Local emergency counter sync",
      };
    }
    return {
      title: "Dashboard",
      subtitle: "M.A.K Indoor Pool Management",
    };
  };

  const headerInfo = getPageHeaderInfo();

  return (
    <div className="min-h-screen bg-[#EBF2FA] flex flex-col lg:flex-row text-slate-900 font-sans antialiased p-0 lg:p-4 gap-0 lg:gap-5 selection:bg-[#1D68BD] selection:text-white">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md text-slate-900 p-3 flex justify-between items-center border-b border-slate-200 sticky top-0 z-50 shadow-2xs">
        <div className="flex items-center gap-2">
          <MakLogo variant="mark" size="sm" />
          <div>
            <span className="font-extrabold text-xs tracking-tight block leading-tight text-slate-900">M.A.K Indoor Pool</span>
            <span className="text-[9px] text-slate-500 font-medium block">Ops Manager</span>
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
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden transition-opacity"
        />
      )}

      {/* Floating White Rounded Sidebar (Pinned Sticky on Desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-xl lg:rounded-3xl p-4 flex flex-col justify-between border border-white/80 shadow-[0_10px_35px_rgba(20,60,110,0.06)] transform lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:translate-x-0 transition-transform duration-200 ease-out shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1">
          {/* Brand Header */}
          <div className="flex items-center justify-center px-2 py-2 mb-3 border-b border-slate-100/90 pb-3">
            <MakLogo variant="full" size="lg" />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
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
                  {item.hasSubmenu && (
                    <ChevronDown className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  )}
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                      {item.badge}
                    </span>
                  )}
                  {item.name === "Complaints & Feedback" && !item.badge && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Developed by MishGa Footer */}
        <div className="pt-3 border-t border-slate-100 space-y-2 shrink-0">
          {user && (
            <div className="bg-slate-50/90 rounded-2xl p-2.5 border border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : "O"}
                </div>
                <div className="text-left overflow-hidden">
                  <span className="font-bold text-xs text-slate-900 block truncate leading-tight">
                    {user.name || "Pool Owner"}
                  </span>
                  <span className="text-[10px] text-slate-400 block leading-tight capitalize">
                    {user.role === "POOL_OWNER" ? "Owner" : user.role || "Staff"}
                  </span>
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar (Exact match across Mockup Image 1 and Image 2) */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 mb-4 pt-1 px-3 sm:px-0">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {headerInfo.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {headerInfo.subtitle}
            </p>
          </div>

          {/* Right Header Status Bar (Exact Mockup Match) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Pill */}
            <div className="bg-white rounded-2xl px-3.5 py-1.5 border border-white shadow-xs flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{livePoolClock.date || "Today"}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>


            {/* Notifications Bell */}
            <div className="w-8 h-8 rounded-2xl bg-white border border-white shadow-xs flex items-center justify-center relative text-slate-600 hover:text-slate-900 cursor-pointer transition">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </div>



            {/* Owner Profile Pill in Top Bar (Shown on Subpages as in Mockup Image 2) */}
            {pathname !== "/admin" && (
              <div className="bg-white rounded-2xl pl-1 pr-3 py-1 border border-white shadow-xs flex items-center gap-2 text-xs font-bold text-slate-800">
                <div className="w-6 h-6 rounded-xl bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "O"}
                </div>
                <span>{user?.role === "POOL_OWNER" ? "Owner" : user?.name || "Owner"}</span>
              </div>
            )}
          </div>
        </header>

        {/* Page Children Content */}
        <main className="flex-1 pb-6 px-3 sm:px-0">
          {children}
        </main>
      </div>
    </div>
  );
}
