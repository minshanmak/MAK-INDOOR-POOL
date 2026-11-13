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
  CheckCircle2,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [livePoolClock, setLivePoolClock] = useState({ date: "", time: "" });
  const [notificationData, setNotificationData] = useState<{ unreadCount: number; notifications: any[] }>({
    unreadCount: 0,
    notifications: [],
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

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
    if (pathname === "/admin/login") return;

    const fetchNotificationsSummary = async () => {
      try {
        const res = await fetch("/api/admin/notifications");
        if (res.ok) {
          const json = await res.json();
          setNotificationData(json);
        }
      } catch (err) {
        // Safe catch
      }
    };

    fetchNotificationsSummary();
    const interval = setInterval(fetchNotificationsSummary, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

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
    { name: "Bookings", href: "/admin/bookings", icon: CalendarDays },
    { name: "Customers", href: "/admin/customers", icon: User },
    { name: "Walk-ins & Occupancy", href: "/admin/walkins", icon: UserCheck },
    { name: "QR Scanner", href: "/admin/scan", icon: QrCode },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Cancellations & Refunds", href: "/admin/cancellations", icon: XCircle },
    { name: "Complaints & Feedback", href: "/admin/complaints", icon: MessageSquareWarning },
    {
      name: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
      badge: notificationData.unreadCount > 0 ? notificationData.unreadCount : undefined,
    },
    { name: "Maintenance", href: "/admin/maintenance", icon: Droplets },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    ...(isOwnerOrAdmin
      ? [
          { name: "Staff & Permissions", href: "/admin/staff", icon: Users2 },
          { name: "System Settings", href: "/admin/settings", icon: Settings },
        ]
      : []),
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
        title: "Walk-ins & Occupancy",
        subtitle: "Live pool capacity, instant counter entries, and active swimmers",
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
    if (pathname.startsWith("/admin/notifications")) {
      return {
        title: "Notifications Center",
        subtitle: "Live operational alerts, water quality tests, and balances",
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

        {/* Minimal Footer */}
        <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 shrink-0">
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


            {/* Notifications Bell & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-8 h-8 rounded-2xl bg-white border border-white shadow-xs flex items-center justify-center relative text-slate-600 hover:text-slate-900 cursor-pointer transition active:scale-95"
                title="Operational Notifications"
              >
                <Bell className="w-4 h-4 stroke-[1.75]" />
                {notificationData.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                    {notificationData.unreadCount > 9 ? "9+" : notificationData.unreadCount}
                  </span>
                )}
              </button>

              {/* Floating Dropdown Popover */}
              {notificationsOpen && (
                <>
                  <div
                    onClick={() => setNotificationsOpen(false)}
                    className="fixed inset-0 z-40 bg-transparent"
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl p-4 shadow-xl border border-slate-100 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#1D68BD] stroke-[1.75]" />
                        <span className="font-extrabold text-xs text-slate-900">
                          Operational Alerts ({notificationData.unreadCount})
                        </span>
                      </div>
                      <Link
                        href="/admin/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="text-[11px] font-bold text-[#1D68BD] hover:underline"
                      >
                        View all
                      </Link>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {notificationData.notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">
                          <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                          <p className="font-bold text-slate-600">No active alerts</p>
                          <p className="text-[10px]">Operations running smoothly</p>
                        </div>
                      ) : (
                        notificationData.notifications.slice(0, 4).map((n) => (
                          <Link
                            key={n.id}
                            href={n.actionUrl}
                            onClick={() => setNotificationsOpen(false)}
                            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition block text-left space-y-0.5 border border-slate-100"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                                  n.priority === "URGENT"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {n.priority}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                            </div>
                            <h5 className="font-bold text-xs text-slate-900 truncate">{n.title}</h5>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{n.message}</p>
                          </Link>
                        ))
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <Link
                        href="/admin/notifications"
                        onClick={() => setNotificationsOpen(false)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <span>Open Notifications Center</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>



            {/* User Profile Menu Dropdown (Top Right - Inside Application Style) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="h-8 pl-1 pr-2.5 rounded-2xl bg-white border border-white shadow-xs flex items-center gap-2 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
                title="Account & Sign Out"
              >
                <div className="w-6 h-6 rounded-xl bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "P"}
                </div>
                <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate hidden sm:inline-block">
                  {user?.name || "Pool Owner"}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Floating Profile Dropdown Popover */}
              {profileOpen && (
                <>
                  <div
                    onClick={() => setProfileOpen(false)}
                    className="fixed inset-0 z-40 bg-transparent"
                  />
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-3xl p-3.5 shadow-xl border border-slate-100 z-50 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-1 py-1 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {user?.name ? user.name.charAt(0).toUpperCase() : "P"}
                        </div>
                        <div className="overflow-hidden">
                          <span className="font-extrabold text-xs text-slate-900 block truncate leading-tight">
                            {user?.name || "Pool Owner"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold block leading-tight capitalize mt-0.5">
                            {user?.role === "POOL_OWNER" ? "Owner (Full Access)" : user?.role || "Staff"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-0.5 text-xs font-semibold text-slate-700">
                      <Link
                        href="/"
                        target="_blank"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-50 transition text-slate-700"
                      >
                        <ExternalLink className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                        <span>Public Website</span>
                      </Link>

                      {isOwnerOrAdmin && (
                        <>
                          <Link
                            href="/admin/staff"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-50 transition text-slate-700"
                          >
                            <Users2 className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                            <span>Staff &amp; Permissions</span>
                          </Link>
                          <Link
                            href="/admin/settings"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-50 transition text-slate-700"
                          >
                            <Settings className="w-4 h-4 text-slate-400 stroke-[1.75]" />
                            <span>System Settings</span>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer active:scale-98"
                      >
                        <LogOut className="w-4 h-4 stroke-[1.75]" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
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
