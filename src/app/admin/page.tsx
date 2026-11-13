"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Clock,
  Sparkles,
  QrCode,
  UserCheck,
  CalendarClock,
  Coins,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Droplets,
  ChevronRight,
  Wifi,
  WifiOff,
  Flame,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  PhoneCall,
  Activity,
  Plus,
} from "lucide-react";
import { formatSlotTime } from "@/lib/timezone";
import { offlineStore } from "@/lib/offline-store";
import CounterTimeline from "@/components/admin/CounterTimeline";
import WalkInSheetModal from "@/components/admin/WalkInSheetModal";
import SlotHoldModal from "@/components/admin/SlotHoldModal";
import WaterLogModal from "@/components/admin/WaterLogModal";
import EndOfDayModal from "@/components/admin/EndOfDayModal";

export default function AdminCounterDashboard() {
  const router = useRouter();

  // Dashboard Data State
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals Visibility
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isHoldOpen, setIsHoldOpen] = useState(false);
  const [isWaterLogOpen, setIsWaterLogOpen] = useState(false);
  const [isClosingOpen, setIsClosingOpen] = useState(false);

  // Offline / Connectivity State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Monitor connectivity
  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = typeof navigator !== "undefined" ? navigator.onLine : true;
      setIsOnline(online);
      const queue = offlineStore.getPendingQueue();
      setPendingSyncCount(queue.filter((item) => item.status === "PENDING").length);
    };

    updateOnlineStatus();
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Fetch Dashboard Metrics
  const fetchDashboardMetrics = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/metrics");
      if (!res.ok) throw new Error("Failed to load counter metrics.");
      const json = await res.json();
      setData(json);

      // Cache bookings locally for offline lookup
      if (json.todayBookings && Array.isArray(json.todayBookings)) {
        offlineStore.cacheTodayBookings(json.todayBookings);
      }
    } catch (err: any) {
      console.warn("Metrics load error:", err);
      // Fallback: If offline, retrieve cached data
      if (!isOnline) {
        const cachedBookings = offlineStore.getCachedTodayBookings();
        setData((prev: any) => ({
          ...prev,
          todayBookings: cachedBookings,
        }));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchDashboardMetrics();
    // Auto-refresh every 30 seconds for live counter updates
    const interval = setInterval(() => {
      fetchDashboardMetrics(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardMetrics]);

  // Session Actions: Check Out
  const handleCheckoutSession = async (session: any) => {
    if (!confirm(`Confirm check-out for ${session.customerName} (${session.guests} guests)?`)) {
      return;
    }

    setActionLoadingId(session.sessionId);
    try {
      if (session.source === "WALKIN") {
        const res = await fetch("/api/admin/walkins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "CHECK_OUT", walkInId: session.id }),
        });
        if (!res.ok) throw new Error("Could not check out walk-in.");
      } else {
        // Online booking checkout
        const res = await fetch("/api/admin/bookings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: session.id, status: "COMPLETED" }),
        });
        if (!res.ok) throw new Error("Could not update booking status.");
      }

      setNotification({
        type: "success",
        message: `${session.customerName} checked out successfully.`,
      });
      fetchDashboardMetrics(true);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to check out session.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Session Actions: Extend
  const handleExtendSession = async (session: any) => {
    const extensionHours = 1;
    const additionalCharge = session.sessionType === "PUBLIC" ? session.guests * 150 : 1500;

    if (
      !confirm(
        `Extend session by ${extensionHours} hour for ₹${additionalCharge}? Please collect payment from customer.`
      )
    ) {
      return;
    }

    setActionLoadingId(session.sessionId);
    try {
      if (session.source === "WALKIN") {
        const res = await fetch("/api/admin/walkins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "EXTEND",
            walkInId: session.id,
            durationHours: (session.durationHours || 1) + extensionHours,
            collectedAmount: additionalCharge,
            paymentMethod: "CASH",
          }),
        });
        if (!res.ok) throw new Error("Could not extend walk-in.");
      } else {
        router.push(`/admin/bookings?focus=${session.id}`);
        return;
      }

      setNotification({
        type: "success",
        message: `${session.customerName} extended by 1 hour.`,
      });
      fetchDashboardMetrics(true);
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to extend session.",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl p-8 border border-white shadow-xs">
        <div className="w-9 h-9 border-3 border-[#0284C7] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600">Loading counter operations...</p>
      </div>
    );
  }

  const {
    currentMode = "PUBLIC",
    modeChangeInfo = "Operating normally",
    currentTimeStr = "12:00",
    todayStr = "",
    turnoverWarning,
    waterLogDue,
    outOfRangeAlert,
    metrics = {},
    activeSessions = [],
    pendingBalancesList = [],
    timelineData = {},
    todayBookings = [],
  } = data || {};

  const publicGauge = metrics.publicGauge || {
    currentSwimmers: 0,
    maxCapacity: 25,
    spotsRemaining: 25,
    cells: Array.from({ length: 25 }, (_, i) => ({ index: i + 1, isOccupied: false, colorTier: "sky" })),
    onlineBookingsCount: 0,
    walkInsCount: 0,
    todayCash: 0,
    todayUpi: 0,
    todayTotal: 0,
  };

  const privateModeStatus = metrics.privateModeStatus;
  const overdueSessions = activeSessions.filter((s: any) => s.urgency === "OVERDUE");

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Offline Alert Strip (Persistent Amber Bar when offline) */}
      {!isOnline && (
        <div className="p-3.5 bg-amber-500 text-white rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Offline. Admissions and walk-ins are saved on this device.</span>
          </div>
          <span className="px-2.5 py-1 bg-amber-600/70 rounded-xl text-[11px] font-mono">
            {pendingSyncCount} pending sync
          </span>
        </div>
      )}

      {/* 2. Operations Status Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Mode Badge & Change Notice */}
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
              currentMode === "PUBLIC"
                ? "bg-sky-50 text-[#0284C7] border border-sky-100"
                : currentMode === "PRIVATE"
                ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            {currentMode === "PUBLIC" ? (
              <Users className="w-6 h-6 stroke-[1.75]" />
            ) : currentMode === "PRIVATE" ? (
              <Sparkles className="w-6 h-6 stroke-[1.75]" />
            ) : (
              <Clock className="w-6 h-6 stroke-[1.75]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-900 tracking-tight">
                {currentMode === "PUBLIC"
                  ? "Public Swimming"
                  : currentMode === "PRIVATE"
                  ? "Private Family Session"
                  : "Pool Closed"}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  currentMode === "PUBLIC"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : currentMode === "PRIVATE"
                    ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {currentMode}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
              <span>{modeChangeInfo}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-600">{currentTimeStr} IST</span>
            </p>
          </div>
        </div>

        {/* Right: Sync Status & Refresh */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
              isOnline
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Synced</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>{pendingSyncCount} pending sync</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardMetrics()}
            disabled={refreshing}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 rounded-2xl border border-slate-200 transition"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 stroke-[1.75] ${refreshing ? "animate-spin text-[#0284C7]" : ""}`} />
          </button>
        </div>
      </div>

      {/* 3. Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 border ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 stroke-[1.75]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 stroke-[1.75]" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-black underline ml-auto cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4. Alert Strip (Overstays, 3:45 PM Clearing Warning, Water Safety Alert) */}
      <div className="space-y-2">
        {/* Overdue Alert */}
        {overdueSessions.length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-900 font-bold">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 stroke-[1.75]" />
              <span>
                {overdueSessions.length} session{overdueSessions.length > 1 ? "s" : ""} overdue! Grace period exceeded.
                Review overtime billings below.
              </span>
            </div>
            <a href="#active-sessions" className="underline text-rose-700 text-xs font-black">
              View overdue
            </a>
          </div>
        )}

        {/* 3:45 PM Turnover Alert */}
        {turnoverWarning?.active && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900 font-bold">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 stroke-[1.75]" />
              <span>{turnoverWarning.message}</span>
            </div>
            <span className="px-2.5 py-1 bg-amber-200/80 rounded-xl text-[11px] font-black uppercase text-amber-900">
              Clear pool
            </span>
          </div>
        )}

        {/* Water Log Due Alert */}
        {waterLogDue && (
          <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between text-xs text-sky-900 font-bold">
            <div className="flex items-center gap-2.5">
              <Droplets className="w-4 h-4 text-[#0284C7] shrink-0 stroke-[1.75]" />
              <span>Water safety reading is due now (chlorine &amp; pH verification).</span>
            </div>
            <button
              type="button"
              onClick={() => setIsWaterLogOpen(true)}
              className="px-3 py-1.5 bg-[#0284C7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Log water
            </button>
          </div>
        )}

        {/* Water Out of Range Alert */}
        {outOfRangeAlert && (
          <div className="p-3.5 bg-red-50 border border-red-300 rounded-2xl flex items-center justify-between text-xs text-red-900 font-bold">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 stroke-[1.75]" />
              <span>{outOfRangeAlert.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsWaterLogOpen(true)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Re-test now
            </button>
          </div>
        )}
      </div>

      {/* 5. Quick Actions Row (>= 44px Touch Targets for Standing Tablet Staff) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Quick Action 1: Walk-in */}
        <button
          type="button"
          onClick={() => setIsWalkInOpen(true)}
          disabled={currentMode === "PRIVATE"}
          className={`min-h-[50px] p-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2.5 transition shadow-xs active:scale-98 ${
            currentMode === "PRIVATE"
              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              : "bg-[#0284C7] hover:bg-[#0369a1] text-white border border-[#0284C7]"
          }`}
        >
          <UserCheck className="w-4 h-4 stroke-[1.75]" />
          <span>Walk-in</span>
        </button>

        {/* Quick Action 2: Scan QR */}
        <Link
          href="/admin/scan"
          className="min-h-[50px] p-3.5 bg-white hover:bg-slate-50 active:scale-98 text-slate-900 border border-slate-200/90 rounded-2xl font-black text-xs flex items-center justify-center gap-2.5 transition shadow-xs"
        >
          <QrCode className="w-4 h-4 text-[#0284C7] stroke-[1.75]" />
          <span>Scan QR</span>
        </Link>

        {/* Quick Action 3: Hold Slot */}
        <button
          type="button"
          onClick={() => setIsHoldOpen(true)}
          className="min-h-[50px] p-3.5 bg-white hover:bg-slate-50 active:scale-98 text-slate-900 border border-slate-200/90 rounded-2xl font-black text-xs flex items-center justify-center gap-2.5 transition shadow-xs"
        >
          <PhoneCall className="w-4 h-4 text-purple-600 stroke-[1.75]" />
          <span>Hold slot</span>
        </button>

        {/* Quick Action 4: Cash Balance */}
        <button
          type="button"
          onClick={() => setIsClosingOpen(true)}
          className="min-h-[50px] p-3.5 bg-white hover:bg-slate-50 active:scale-98 text-slate-900 border border-slate-200/90 rounded-2xl font-black text-xs flex items-center justify-center gap-2.5 transition shadow-xs"
        >
          <Coins className="w-4 h-4 text-emerald-600 stroke-[1.75]" />
          <span>Cash balance</span>
        </button>

        {/* Quick Action 5: Log Water */}
        <button
          type="button"
          onClick={() => setIsWaterLogOpen(true)}
          className="col-span-2 sm:col-span-1 min-h-[50px] p-3.5 bg-white hover:bg-slate-50 active:scale-98 text-slate-900 border border-slate-200/90 rounded-2xl font-black text-xs flex items-center justify-center gap-2.5 transition shadow-xs"
        >
          <Droplets className="w-4 h-4 text-[#0284C7] stroke-[1.75]" />
          <span>Log water</span>
        </button>
      </div>

      {/* 6. MODE-SPECIFIC OPERATIONAL PANELS */}

      {/* A. PUBLIC MODE: 25-Cell Segmented Bar & Counter Summary */}
      {currentMode !== "PRIVATE" && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Public Occupancy Meter
                </span>
                <span className="text-[10px] bg-sky-50 text-[#0284C7] font-bold px-2 py-0.5 rounded-full">
                  Cap: 25 Max
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {publicGauge.currentSwimmers}
                  <span className="text-lg font-bold text-slate-400"> / 25</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  ({publicGauge.spotsRemaining} spot{publicGauge.spotsRemaining === 1 ? "" : "s"} remaining)
                </span>
              </div>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400 stroke-[1.75]" />
                <span>{publicGauge.onlineBookingsCount} online</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400 stroke-[1.75]" />
                <span>{publicGauge.walkInsCount} walk-in</span>
              </span>
            </div>
          </div>

          {/* 25-CELL SEGMENTED BAR: 0-19 sky, 20-23 amber, 24-25 red */}
          <div className="space-y-2">
            <div className="grid grid-cols-25 gap-1 sm:gap-1.5 h-10 w-full rounded-2xl p-1.5 bg-slate-100 border border-slate-200/60">
              {publicGauge.cells.map((cell: any) => {
                let cellClass = "bg-slate-200/80"; // Empty cell default
                if (cell.isOccupied) {
                  if (cell.colorTier === "red") cellClass = "bg-red-500 shadow-xs shadow-red-500/40";
                  else if (cell.colorTier === "amber") cellClass = "bg-amber-500 shadow-xs shadow-amber-500/40";
                  else cellClass = "bg-[#0284C7] shadow-xs shadow-sky-600/40";
                }

                return (
                  <div
                    key={cell.index}
                    className={`h-full rounded-md transition-all duration-300 relative group ${cellClass}`}
                    title={`Spot ${cell.index} of 25: ${cell.isOccupied ? "Occupied" : "Available"}`}
                  >
                    <span className="sr-only">Spot {cell.index}</span>
                  </div>
                );
              })}
            </div>

            {/* Color Legend */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-1 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0284C7]" />
                <span>Normal (1–19)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>Busy (20–23)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                <span>Hard Cap (24–25)</span>
              </div>
            </div>
          </div>

          {/* Today's Collections Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Cash counter</span>
              <span className="text-base font-black text-slate-900 font-mono mt-0.5 block">
                ₹{publicGauge.todayCash.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">UPI collections</span>
              <span className="text-base font-black text-purple-700 font-mono mt-0.5 block">
                ₹{publicGauge.todayUpi.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-sky-50/60 border border-sky-100">
              <span className="text-[10px] text-sky-700 font-bold uppercase block">Today total</span>
              <span className="text-base font-black text-[#0284C7] font-mono mt-0.5 block">
                ₹{publicGauge.todayTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* B. PRIVATE MODE: Active Exclusive Booking & Headcount Billing */}
      {currentMode === "PRIVATE" && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-indigo-100 shadow-[0_4px_20px_rgba(20,60,110,0.04)] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700 block">
                Exclusive Private Session
              </span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {privateModeStatus ? privateModeStatus.customerName : "No Active Private Booking"}
              </h3>
              {privateModeStatus && (
                <p className="text-xs text-slate-500 font-medium">
                  {privateModeStatus.startTime} – {privateModeStatus.endTime} IST ({privateModeStatus.bookingId})
                </p>
              )}
            </div>

            {privateModeStatus?.balanceDue > 0 && (
              <div className="px-4 py-2 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold text-right">
                <span className="text-[10px] uppercase block text-rose-600">Balance due</span>
                <span className="text-lg font-black font-mono">₹{privateModeStatus.balanceDue}</span>
              </div>
            )}
          </div>

          {privateModeStatus ? (
            <div className="space-y-4">
              {/* Buffer Overrun Conflict Banner */}
              {privateModeStatus.bufferConflict && (
                <div className="p-4 bg-red-500 text-white rounded-2xl text-xs font-bold flex items-start gap-3 shadow-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 stroke-[1.75]" />
                  <div>
                    <h4 className="font-black text-sm">Turnover Buffer Conflict</h4>
                    <p className="text-red-100 mt-0.5">{privateModeStatus.bufferConflictMessage}</p>
                  </div>
                </div>
              )}

              {/* Headcount breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total swimmers</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                    {privateModeStatus.guestCount}
                    <span className="text-xs text-slate-400 font-normal"> / 25 cap</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Included guests</span>
                  <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">
                    12 <span className="text-xs text-slate-400 font-normal">in base price</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Extra guests</span>
                  <span className="text-xl font-black text-amber-600 font-mono mt-0.5 block">
                    {privateModeStatus.extraGuests}{" "}
                    <span className="text-xs text-slate-400 font-normal">@ ₹100/hr</span>
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Extra billing</span>
                  <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">
                    ₹{privateModeStatus.extraBillingAmount}
                  </span>
                </div>
              </div>

              {/* Next Booking & Turnover Task */}
              {privateModeStatus.nextBooking && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 stroke-[1.75]" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-600 block">
                        Next private session
                      </span>
                      <span className="font-extrabold text-slate-900 block mt-0.5">
                        {privateModeStatus.nextBooking.customerName} ({privateModeStatus.nextBooking.guestCount} guests)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Starts at {privateModeStatus.nextBooking.startTime} IST
                      </span>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 bg-white rounded-xl border border-indigo-200 text-indigo-900 font-bold text-xs">
                    15-min "Filter and clean" turnover scheduled
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl">
              <p className="text-xs font-semibold">The pool is currently in private evening hours.</p>
            </div>
          )}
        </div>
      )}

      {/* 7. ACTIVE SESSIONS LIST (Sorted by Urgency: OVERDUE, EXPIRING_SOON, ACTIVE) */}
      <div id="active-sessions" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Active Sessions</h3>
            <p className="text-xs text-slate-500">Swimmers currently in pool, sorted by urgency</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
            {activeSessions.length} active
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 space-y-2">
            <Users className="w-8 h-8 mx-auto text-slate-300 stroke-[1.75]" />
            <p className="text-xs font-bold text-slate-600">No swimmers currently checked into pool.</p>
            <p className="text-[11px] text-slate-400">Admit arrivals via Scan QR or record a Walk-in above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {activeSessions.map((session: any) => {
              const isOverdue = session.urgency === "OVERDUE";
              const isExpiring = session.urgency === "EXPIRING_SOON";

              return (
                <div
                  key={session.sessionId}
                  className={`rounded-3xl p-5 border transition-all shadow-xs flex flex-col justify-between gap-4 ${
                    isOverdue
                      ? "bg-rose-50/70 border-rose-300 shadow-rose-200/50"
                      : isExpiring
                      ? "bg-amber-50/70 border-amber-300 shadow-amber-200/50"
                      : "bg-white border-slate-200/90 hover:border-slate-300"
                  }`}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              session.sessionType === "FAMILY"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {session.sessionType === "FAMILY" ? "Private" : "Public"}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                            {session.source}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 mt-1 truncate">
                          {session.customerName}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">{session.id}</p>
                      </div>

                      {/* Urgency Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase shrink-0 ${
                          isOverdue
                            ? "bg-rose-600 text-white animate-pulse"
                            : isExpiring
                            ? "bg-amber-500 text-white"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isOverdue ? "Overdue" : isExpiring ? "Ending soon" : "Active"}
                      </span>
                    </div>

                    {/* Guest Count & Timing */}
                    <div className="mt-3.5 pt-3 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Swimmers</span>
                        <span className="font-black text-slate-900 mt-0.5 block">{session.guests} guests</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Slot</span>
                        <span className="font-bold text-slate-700 font-mono mt-0.5 block">
                          {session.startTime} – {session.plannedEndTime}
                        </span>
                      </div>
                    </div>

                    {/* Overtime & Countdown banner */}
                    {isOverdue ? (
                      <div className="mt-3 p-2.5 rounded-xl bg-rose-100/90 text-rose-900 text-[11px] font-bold space-y-1">
                        <div className="flex justify-between items-center">
                          <span>Overtime:</span>
                          <span className="font-mono text-rose-950 font-black">{session.overdueMinutes} mins</span>
                        </div>
                        {session.projectedOverstayCharge > 0 && (
                          <div className="flex justify-between items-center text-rose-700 border-t border-rose-200/80 pt-1">
                            <span>Projected extra charge:</span>
                            <span className="font-black font-mono">₹{session.projectedOverstayCharge}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-2 rounded-xl">
                        <span>Time remaining:</span>
                        <span className={`font-mono font-black ${isExpiring ? "text-amber-700" : "text-slate-900"}`}>
                          {session.remainingMinutes} mins
                        </span>
                      </div>
                    )}

                    {/* Balance due indicator if applicable */}
                    {session.balanceAmount > 0 && (
                      <div className="mt-2 text-[11px] font-bold text-rose-600 flex items-center justify-between">
                        <span>Balance due on arrival:</span>
                        <span className="font-mono font-black">₹{session.balanceAmount}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions (>= 44px Touch Targets) */}
                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCheckoutSession(session)}
                      disabled={actionLoadingId === session.sessionId}
                      className="min-h-[44px] py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {actionLoadingId === session.sessionId ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[1.75]" />
                      )}
                      <span>Check out</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExtendSession(session)}
                      disabled={actionLoadingId === session.sessionId}
                      className="min-h-[44px] py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#0284C7] stroke-[1.75]" />
                      <span>Extend</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. DUAL-LANE HORIZONTAL TIMELINE (9:00 AM to 11:00 PM) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Today's Schedule &amp; Lanes</h3>
          <p className="text-xs text-slate-500">Public lane heat strip, private lane blocks, and 15-minute cleaning buffers</p>
        </div>

        <CounterTimeline
          bookings={todayBookings}
          currentTimeStr={currentTimeStr}
          bufferMinutes={15}
        />
      </div>

      {/* 9. PENDING BALANCES LIST (Checked-in private bookings with unpaid balance) */}
      {pendingBalancesList.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Pending Balances</h3>
              <p className="text-xs text-slate-500">Private bookings requiring counter settlement</p>
            </div>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
              ₹{pendingBalancesList.reduce((sum: number, b: any) => sum + b.balanceDue, 0)} total
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {pendingBalancesList.map((item: any) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">{item.customerName}</span>
                  <span className="text-slate-500 text-[11px]">
                    {item.slotTime} • {item.guestCount} guests • Ref: {item.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-rose-600 text-sm block">₹{item.balanceDue}</span>
                  <span className="text-[10px] text-slate-400">Advance ₹{item.advancePaid} paid</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      <WalkInSheetModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        currentOccupancy={publicGauge.currentSwimmers}
        maxCapacity={25}
        isPrivateSessionActive={currentMode === "PRIVATE"}
        nextPublicSessionText="Tomorrow at 9:00 AM"
        onSuccess={() => {
          setIsWalkInOpen(false);
          setNotification({ type: "success", message: "Walk-in admitted successfully." });
          fetchDashboardMetrics(true);
        }}
      />

      <SlotHoldModal
        isOpen={isHoldOpen}
        onClose={() => setIsHoldOpen(false)}
        onSuccess={() => {
          setIsHoldOpen(false);
          setNotification({ type: "success", message: "Slot soft hold reserved for 15 minutes." });
          fetchDashboardMetrics(true);
        }}
      />

      <WaterLogModal
        isOpen={isWaterLogOpen}
        onClose={() => setIsWaterLogOpen(false)}
        onSuccess={() => {
          setIsWaterLogOpen(false);
          setNotification({ type: "success", message: "Water reading recorded successfully." });
          fetchDashboardMetrics(true);
        }}
      />

      <EndOfDayModal
        isOpen={isClosingOpen}
        onClose={() => setIsClosingOpen(false)}
        expectedData={{
          expectedCash: publicGauge.todayCash,
          expectedUpi: publicGauge.todayUpi,
          onlineAdvances: metrics.todayCollections?.gateway || 0,
          pendingBalances: pendingBalancesList.map((b: any) => ({
            bookingId: b.id,
            customerName: b.customerName,
            customerPhone: b.customerPhone,
            unpaidBalance: b.balanceDue,
          })),
        }}
        onSuccess={() => {
          setIsClosingOpen(false);
          setNotification({ type: "success", message: "Day register closed and balanced." });
          fetchDashboardMetrics(true);
        }}
      />
    </div>
  );
}
