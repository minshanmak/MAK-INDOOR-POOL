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
  Coins,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Droplets,
  ChevronRight,
  Wifi,
  WifiOff,
  PhoneCall,
  Plus,
  ShieldCheck,
  ArrowRight,
  SlidersHorizontal,
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

  // Operational Mode Toggle (Auto-detect from IST time, or manual preview for front desk)
  const [modeView, setModeView] = useState<"AUTO" | "PUBLIC" | "PRIVATE">("AUTO");

  // Modals Visibility
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isHoldOpen, setIsHoldOpen] = useState(false);
  const [isWaterLogOpen, setIsWaterLogOpen] = useState(false);
  const [isClosingOpen, setIsClosingOpen] = useState(false);

  // Connectivity State
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

  // Session Actions: Check Out (Toast/Resy host-stand pattern)
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
      <div className="min-h-[460px] flex flex-col items-center justify-center gap-3 bg-white rounded-[12px] p-6 border-[0.5px] border-slate-200 shadow-xs">
        <div className="w-8 h-8 border-2 border-[#0284C7] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Loading counter operations...</p>
      </div>
    );
  }

  const {
    currentMode: serverMode = "PUBLIC",
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

  // Active operational mode: either auto-detected from server or staff manual toggle
  const activeMode: "PUBLIC" | "PRIVATE" | "CLOSED" =
    modeView === "AUTO" ? serverMode : modeView;

  const publicGauge = metrics.publicGauge || {
    currentSwimmers: 14,
    maxCapacity: 25,
    spotsRemaining: 11,
    cells: Array.from({ length: 25 }, (_, i) => ({
      index: i + 1,
      isOccupied: i < 14,
      colorTier: i >= 23 ? "red" : i >= 19 ? "amber" : "sky",
    })),
    onlineBookingsCount: 8,
    walkInsCount: 6,
    todayCash: 2400,
    todayUpi: 3600,
    todayTotal: 6000,
  };

  const privateModeStatus = metrics.privateModeStatus || {
    bookingId: "MAK-20261113-004",
    customerName: "Rashid Ali & Family",
    customerPhone: "+91 98471 23456",
    guestCount: 16,
    includedCount: 12,
    extraGuests: 4,
    extraBillingAmount: 400,
    totalAmount: 1900,
    totalPaid: 750,
    balanceDue: 1150,
    startTime: "16:00",
    endTime: "17:00",
    bufferMinutes: 15,
    bufferConflict: false,
    bufferConflictMessage: "",
    nextBooking: {
      id: "MAK-20261113-005",
      customerName: "Kareem Thottathil",
      startTime: "17:15",
      guestCount: 10,
    },
  };

  const overdueSessions = activeSessions.filter((s: any) => s.urgency === "OVERDUE");

  // Public gauge color status label
  const getOccupancyStatus = (count: number) => {
    if (count >= 24) return { label: "Hard cap reached", colorClass: "text-red-700 bg-red-50 border-red-200" };
    if (count >= 20) return { label: "Busy capacity", colorClass: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "Normal capacity", colorClass: "text-[#0284C7] bg-sky-50 border-sky-200" };
  };

  const occupancyStatus = getOccupancyStatus(publicGauge.currentSwimmers);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12 font-sans selection:bg-[#0284C7] selection:text-white">
      {/* 1. Offline Alert Strip (Persistent Amber Bar when offline) */}
      {!isOnline && (
        <div className="p-3 bg-amber-500 text-white rounded-[12px] border-[0.5px] border-amber-600 flex items-center justify-between text-xs font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Offline. Admissions are saved on this device.</span>
          </div>
          <span className="px-2 py-0.5 bg-amber-600 rounded-[12px] text-[11px] font-mono font-bold">
            {pendingSyncCount} pending sync
          </span>
        </div>
      )}

      {/* 2. Operations Status Bar (Visual System: 0.5px border, 12px radius, restrained palette) */}
      <div className="bg-white rounded-[12px] p-4 border-[0.5px] border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Mode Badge & Change Notice */}
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-[12px] flex items-center justify-center font-bold text-xs shrink-0 ${
              activeMode === "PUBLIC"
                ? "bg-sky-50 text-[#0284C7] border-[0.5px] border-sky-200"
                : activeMode === "PRIVATE"
                ? "bg-indigo-50 text-indigo-700 border-[0.5px] border-indigo-200"
                : "bg-slate-100 text-slate-700 border-[0.5px] border-slate-200"
            }`}
          >
            {activeMode === "PUBLIC" ? (
              <Users className="w-5 h-5" strokeWidth={1.75} />
            ) : activeMode === "PRIVATE" ? (
              <Sparkles className="w-5 h-5" strokeWidth={1.75} />
            ) : (
              <Clock className="w-5 h-5" strokeWidth={1.75} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                {activeMode === "PUBLIC"
                  ? "Public swimming"
                  : activeMode === "PRIVATE"
                  ? "Private family session"
                  : "Pool closed"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-[12px] text-[10px] font-bold uppercase tracking-wider border-[0.5px] ${
                  activeMode === "PUBLIC"
                    ? "bg-sky-50 text-[#0284C7] border-sky-200"
                    : activeMode === "PRIVATE"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}
              >
                {activeMode}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5 flex items-center gap-1.5">
              <span>{modeChangeInfo}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-600">{currentTimeStr} IST</span>
            </p>
          </div>
        </div>

        {/* Center/Right: View Switcher (Inspect Public vs Private shell) & Sync Chip */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tablet Mode Preview Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-[12px] border-[0.5px] border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModeView("AUTO")}
              className={`min-h-[36px] px-2.5 py-1 rounded-[8px] transition ${
                modeView === "AUTO"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Live auto
            </button>
            <button
              type="button"
              onClick={() => setModeView("PUBLIC")}
              className={`min-h-[36px] px-2.5 py-1 rounded-[8px] transition ${
                modeView === "PUBLIC"
                  ? "bg-white text-[#0284C7] shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Public mode
            </button>
            <button
              type="button"
              onClick={() => setModeView("PRIVATE")}
              className={`min-h-[36px] px-2.5 py-1 rounded-[8px] transition ${
                modeView === "PRIVATE"
                  ? "bg-white text-indigo-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Private mode
            </button>
          </div>

          {/* Sync Status Indicator (with required text label) */}
          <div
            className={`min-h-[44px] px-3 py-1.5 rounded-[12px] text-xs font-semibold border-[0.5px] flex items-center gap-2 ${
              isOnline
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span>{isOnline ? "Synced" : `${pendingSyncCount} pending sync`}</span>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchDashboardMetrics()}
            disabled={refreshing}
            className="min-h-[44px] min-w-[44px] p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-[12px] border-[0.5px] border-slate-200 transition flex items-center justify-center active:scale-95"
            title="Refresh dashboard data"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin text-[#0284C7]" : ""}`}
              strokeWidth={1.75}
            />
          </button>
        </div>
      </div>

      {/* 3. Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-[12px] text-xs font-semibold flex items-center justify-between gap-3 border-[0.5px] ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" strokeWidth={1.75} />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-bold underline cursor-pointer ml-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4. Alert Strip (Overstays, 3:45 PM Clearing Notice, Water Safety) */}
      <div className="space-y-2">
        {/* Overdue Alert */}
        {overdueSessions.length > 0 && (
          <div className="p-3 bg-rose-50 border-[0.5px] border-rose-300 rounded-[12px] flex items-center justify-between text-xs text-rose-900 font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
              <span>
                {overdueSessions.length} session{overdueSessions.length > 1 ? "s" : ""} overdue. Grace period
                exceeded.
              </span>
            </div>
            <a href="#active-sessions" className="underline text-rose-700 text-xs font-bold">
              Review overstays
            </a>
          </div>
        )}

        {/* 3:45 PM Turnover Alert */}
        {turnoverWarning?.active && (
          <div className="p-3 bg-amber-50 border-[0.5px] border-amber-300 rounded-[12px] flex items-center justify-between text-xs text-amber-900 font-medium">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" strokeWidth={1.75} />
              <span>{turnoverWarning.message}</span>
            </div>
            <span className="px-2 py-0.5 bg-amber-200/80 rounded-[8px] text-[11px] font-bold uppercase text-amber-900">
              Clear pool
            </span>
          </div>
        )}

        {/* Water Log Due Alert */}
        {waterLogDue && (
          <div className="p-3 bg-sky-50 border-[0.5px] border-sky-300 rounded-[12px] flex items-center justify-between text-xs text-sky-900 font-medium">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#0284C7] shrink-0" strokeWidth={1.75} />
              <span>Water safety reading is due now (chlorine and pH verification).</span>
            </div>
            <button
              type="button"
              onClick={() => setIsWaterLogOpen(true)}
              className="min-h-[44px] px-3.5 bg-[#0284C7] hover:bg-[#0369a1] text-white rounded-[12px] text-xs font-bold transition shadow-xs"
            >
              Log water
            </button>
          </div>
        )}

        {/* Water Out of Range Alert */}
        {outOfRangeAlert && (
          <div className="p-3 bg-red-50 border-[0.5px] border-red-300 rounded-[12px] flex items-center justify-between text-xs text-red-900 font-medium">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" strokeWidth={1.75} />
              <span>{outOfRangeAlert.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsWaterLogOpen(true)}
              className="min-h-[44px] px-3.5 bg-red-600 hover:bg-red-700 text-white rounded-[12px] text-xs font-bold transition shadow-xs"
            >
              Re-test now
            </button>
          </div>
        )}
      </div>

      {/* 5. Quick Actions Row (Touch targets >= 44px, Sentence case, 1-2 words) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Action 1: Walk in */}
        <button
          type="button"
          onClick={() => setIsWalkInOpen(true)}
          disabled={activeMode === "PRIVATE"}
          className={`min-h-[48px] p-3 rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 transition border-[0.5px] active:scale-98 ${
            activeMode === "PRIVATE"
              ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              : "bg-[#0284C7] hover:bg-[#0369a1] text-white border-[#0284C7] shadow-xs"
          }`}
        >
          <UserCheck className="w-4 h-4" strokeWidth={1.75} />
          <span>Walk in</span>
        </button>

        {/* Action 2: Scan QR */}
        <Link
          href="/admin/scan"
          className="min-h-[48px] p-3 bg-white hover:bg-slate-50 active:scale-98 text-slate-900 border-[0.5px] border-slate-200 rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
        >
          <QrCode className="w-4 h-4 text-[#0284C7]" strokeWidth={1.75} />
          <span>Scan QR</span>
        </Link>

        {/* Action 3: Hold slot */}
        <button
          type="button"
          onClick={() => setIsHoldOpen(true)}
          className="min-h-[48px] p-3 bg-white hover:bg-slate-50 active:scale-98 text-slate-900 border-[0.5px] border-slate-200 rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
        >
          <PhoneCall className="w-4 h-4 text-purple-600" strokeWidth={1.75} />
          <span>Hold slot</span>
        </button>

        {/* Action 4: Cash balance */}
        <button
          type="button"
          onClick={() => setIsClosingOpen(true)}
          className="min-h-[48px] p-3 bg-white hover:bg-slate-50 active:scale-98 text-slate-900 border-[0.5px] border-slate-200 rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
        >
          <Coins className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
          <span>Cash balance</span>
        </button>

        {/* Action 5: Log water */}
        <button
          type="button"
          onClick={() => setIsWaterLogOpen(true)}
          className="col-span-2 sm:col-span-1 min-h-[48px] p-3 bg-white hover:bg-slate-50 active:scale-98 text-slate-900 border-[0.5px] border-slate-200 rounded-[12px] font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
        >
          <Droplets className="w-4 h-4 text-[#0284C7]" strokeWidth={1.75} />
          <span>Log water</span>
        </button>
      </div>

      {/* 6. MODE-SPECIFIC OPERATIONAL PANELS */}

      {/* SCREEN 1: PUBLIC MODE DASHBOARD */}
      {activeMode !== "PRIVATE" && (
        <div className="space-y-4">
          {/* Occupancy Gauge Card (25-Cell Segmented Bar) */}
          <div className="bg-white rounded-[12px] p-4 sm:p-5 border-[0.5px] border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Public occupancy
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <h3 className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {publicGauge.currentSwimmers}
                    <span className="text-lg font-normal text-slate-400"> / 25</span>
                  </h3>
                  <span className="text-xs text-slate-600">
                    ({publicGauge.spotsRemaining} spot{publicGauge.spotsRemaining === 1 ? "" : "s"} free)
                  </span>
                </div>
              </div>

              {/* Status indicator always paired with text label */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-[12px] text-xs font-semibold border-[0.5px] flex items-center gap-1.5 ${occupancyStatus.colorClass}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      publicGauge.currentSwimmers >= 24
                        ? "bg-red-500"
                        : publicGauge.currentSwimmers >= 20
                        ? "bg-amber-500"
                        : "bg-[#0284C7]"
                    }`}
                  />
                  <span>{occupancyStatus.label}</span>
                </span>
              </div>
            </div>

            {/* 25-Cell Segmented Bar: 0-19 sky, 20-23 amber, 24-25 red */}
            <div className="space-y-2">
              <div className="grid grid-cols-25 gap-1 h-9 w-full rounded-[10px] p-1 bg-slate-100 border-[0.5px] border-slate-200">
                {publicGauge.cells.map((cell: any) => {
                  let cellClass = "bg-slate-200";
                  if (cell.isOccupied) {
                    if (cell.colorTier === "red") cellClass = "bg-red-500";
                    else if (cell.colorTier === "amber") cellClass = "bg-amber-500";
                    else cellClass = "bg-[#0284C7]";
                  }

                  return (
                    <div
                      key={cell.index}
                      className={`h-full rounded-[6px] transition-colors ${cellClass}`}
                      title={`Spot ${cell.index} of 25: ${cell.isOccupied ? "Occupied" : "Available"}`}
                    >
                      <span className="sr-only">Spot {cell.index}</span>
                    </div>
                  );
                })}
              </div>

              {/* Segmented Color Legend paired with numbers & text labels */}
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[4px] bg-[#0284C7]" />
                  <span>Normal (1–19)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[4px] bg-amber-500" />
                  <span>Busy (20–23)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[4px] bg-red-500" />
                  <span>Hard cap (24–25)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Pattern 3: KPI Tiles (Stripe / Behance pattern: Large number, small label, muted secondary line, restrained color, text-labeled status indicator) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* KPI 1: Online bookings */}
            <div className="bg-white rounded-[12px] p-4 border-[0.5px] border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Online bookings</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-[6px] border-[0.5px] border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Confirmed</span>
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                  {publicGauge.onlineBookingsCount}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                Scheduled for today
              </p>
            </div>

            {/* KPI 2: Walk-ins */}
            <div className="bg-white rounded-[12px] p-4 border-[0.5px] border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Walk-in swimmers</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0284C7] bg-sky-50 px-1.5 py-0.5 rounded-[6px] border-[0.5px] border-sky-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                    <span>Counter</span>
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                  {publicGauge.walkInsCount}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                Admitted at front desk
              </p>
            </div>

            {/* KPI 3: Cash collected */}
            <div className="bg-white rounded-[12px] p-4 border-[0.5px] border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Cash drawer</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded-[6px] border-[0.5px] border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span>Physical</span>
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                  ₹{publicGauge.todayCash.toLocaleString("en-IN")}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                Ready for blind closing
              </p>
            </div>

            {/* KPI 4: UPI collected */}
            <div className="bg-white rounded-[12px] p-4 border-[0.5px] border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>UPI collections</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-[6px] border-[0.5px] border-indigo-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>Instant</span>
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-indigo-700 font-mono mt-1">
                  ₹{publicGauge.todayUpi.toLocaleString("en-IN")}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                QR counter settlements
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: PRIVATE MODE DASHBOARD (Same shell, public gauge hidden, active booking, headcount, buffer) */}
      {activeMode === "PRIVATE" && (
        <div className="bg-white rounded-[12px] p-4 sm:p-5 border-[0.5px] border-indigo-200 shadow-xs space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block">
                Active private session
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                {privateModeStatus ? privateModeStatus.customerName : "No active private booking"}
              </h3>
              {privateModeStatus && (
                <p className="text-xs text-slate-500 font-normal">
                  {privateModeStatus.startTime} – {privateModeStatus.endTime} IST • Ref: {privateModeStatus.bookingId}
                </p>
              )}
            </div>

            {privateModeStatus?.balanceDue > 0 && (
              <div className="px-3.5 py-1.5 bg-rose-50 border-[0.5px] border-rose-200 rounded-[12px] text-rose-800 text-xs font-bold text-right">
                <span className="text-[10px] uppercase block text-rose-600 font-bold">Balance due at counter</span>
                <span className="text-base font-extrabold font-mono">₹{privateModeStatus.balanceDue}</span>
              </div>
            )}
          </div>

          {/* Buffer Conflict Banner */}
          {privateModeStatus?.bufferConflict && (
            <div className="p-3 bg-red-600 text-white rounded-[12px] text-xs font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <strong className="block font-bold">Turnover buffer conflict</strong>
                <span>{privateModeStatus.bufferConflictMessage}</span>
              </div>
            </div>
          )}

          {/* Headcount breakdown against 12 included & 25 cap */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-[12px] bg-slate-50 border-[0.5px] border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Total headcount</span>
              <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">
                {privateModeStatus.guestCount}
                <span className="text-xs text-slate-400 font-normal"> / 25 cap</span>
              </span>
            </div>

            <div className="p-3 rounded-[12px] bg-slate-50 border-[0.5px] border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Included in base</span>
              <span className="text-lg font-extrabold text-emerald-700 font-mono mt-0.5 block">
                12 <span className="text-xs text-slate-400 font-normal">guests</span>
              </span>
            </div>

            <div className="p-3 rounded-[12px] bg-slate-50 border-[0.5px] border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Extra guests</span>
              <span className="text-lg font-extrabold text-amber-700 font-mono mt-0.5 block">
                {privateModeStatus.extraGuests} <span className="text-xs text-slate-400 font-normal">@ ₹100/hr</span>
              </span>
            </div>

            <div className="p-3 rounded-[12px] bg-slate-50 border-[0.5px] border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Extra billing</span>
              <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">
                ₹{privateModeStatus.extraBillingAmount}
              </span>
            </div>
          </div>

          {/* Next Booking & Turnover Buffer Card */}
          {privateModeStatus.nextBooking && (
            <div className="p-3.5 rounded-[12px] bg-indigo-50/60 border-[0.5px] border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[8px] bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-700 block">
                    Next private session
                  </span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {privateModeStatus.nextBooking.customerName} ({privateModeStatus.nextBooking.guestCount} guests)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Starts at {privateModeStatus.nextBooking.startTime} IST
                  </span>
                </div>
              </div>

              <div className="px-3 py-1 bg-white rounded-[8px] border-[0.5px] border-indigo-200 text-indigo-900 font-semibold text-xs">
                15-minute "Filter and clean" turnover scheduled
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. URGENT LISTS: ACTIVE SESSIONS (Reference Pattern 4: Toast & Resy host stand pattern: sorted by urgency, overdue state clear) */}
      <div id="active-sessions" className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Active sessions</h3>
            <p className="text-xs text-slate-500">Host-stand view sorted by urgency: overdue first</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-[12px] bg-slate-100 text-slate-700 text-xs font-bold font-mono">
            {activeSessions.length} active
          </span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-[12px] border-[0.5px] border-slate-200 text-slate-400 space-y-1.5">
            <Users className="w-7 h-7 mx-auto text-slate-300" strokeWidth={1.75} />
            <p className="text-xs font-semibold text-slate-600">No swimmers currently checked in.</p>
            <p className="text-[11px] text-slate-400">Admit arrivals via Scan QR or record a Walk in above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSessions.map((session: any) => {
              const isOverdue = session.urgency === "OVERDUE";
              const isExpiring = session.urgency === "EXPIRING_SOON";

              return (
                <div
                  key={session.sessionId}
                  className={`rounded-[12px] p-4 border-[0.5px] transition flex flex-col justify-between gap-3 ${
                    isOverdue
                      ? "bg-rose-50/70 border-rose-300"
                      : isExpiring
                      ? "bg-amber-50/70 border-amber-300"
                      : "bg-white border-slate-200"
                  }`}
                >
                  {/* Top Card Info */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase tracking-wider ${
                              session.sessionType === "FAMILY"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-sky-100 text-[#0284C7]"
                            }`}
                          >
                            {session.sessionType === "FAMILY" ? "Private" : "Public"}
                          </span>
                          <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                            {session.source}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 mt-1 truncate">
                          {session.customerName}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">{session.id}</p>
                      </div>

                      {/* Urgency Badge with required text label */}
                      <span
                        className={`px-2.5 py-1 rounded-[12px] text-[10px] font-bold uppercase shrink-0 border-[0.5px] ${
                          isOverdue
                            ? "bg-rose-600 text-white border-rose-600"
                            : isExpiring
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {isOverdue ? "Overdue" : isExpiring ? "Ending soon" : "Active"}
                      </span>
                    </div>

                    {/* Guest Count & Slot */}
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Swimmers</span>
                        <span className="font-bold text-slate-900 block mt-0.5">{session.guests} guests</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Slot</span>
                        <span className="font-semibold text-slate-700 font-mono block mt-0.5">
                          {session.startTime} – {session.plannedEndTime}
                        </span>
                      </div>
                    </div>

                    {/* Overdue / Countdown Box */}
                    {isOverdue ? (
                      <div className="mt-2.5 p-2 rounded-[8px] bg-rose-100 text-rose-950 text-[11px] font-semibold space-y-1">
                        <div className="flex justify-between items-center">
                          <span>Elapsed overtime:</span>
                          <span className="font-mono font-bold">{session.overdueMinutes} mins</span>
                        </div>
                        {session.projectedOverstayCharge > 0 && (
                          <div className="flex justify-between items-center text-rose-800 border-t border-rose-200/80 pt-1">
                            <span>Projected extra charge:</span>
                            <span className="font-mono font-bold">₹{session.projectedOverstayCharge}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-[8px] border-[0.5px] border-slate-200/60">
                        <span>Time remaining:</span>
                        <span className={`font-mono font-bold ${isExpiring ? "text-amber-700" : "text-slate-900"}`}>
                          {session.remainingMinutes} mins
                        </span>
                      </div>
                    )}

                    {/* Balance due */}
                    {session.balanceAmount > 0 && (
                      <div className="mt-1.5 text-[11px] font-bold text-rose-600 flex items-center justify-between">
                        <span>Balance due on arrival:</span>
                        <span className="font-mono">₹{session.balanceAmount}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Action Buttons (>= 44px Touch Targets, Sentence case, 1-2 words) */}
                  <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCheckoutSession(session)}
                      disabled={actionLoadingId === session.sessionId}
                      className="min-h-[44px] py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-[12px] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      {actionLoadingId === session.sessionId ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      )}
                      <span>Check out</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExtendSession(session)}
                      disabled={actionLoadingId === session.sessionId}
                      className="min-h-[44px] py-2 px-3 bg-white hover:bg-slate-50 border-[0.5px] border-slate-200 text-slate-800 rounded-[12px] text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#0284C7]" strokeWidth={1.75} />
                      <span>Extend</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 8. DAY TIMELINE (Reference Pattern 2: Figma / Court Reserve horizontal lanes with hatched buffers & "now" line) */}
      <div className="bg-white rounded-[12px] p-4 sm:p-5 border-[0.5px] border-slate-200 shadow-xs space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Today schedule and lanes</h3>
          <p className="text-xs text-slate-500">Public lane heat strip, private booking blocks, and 15-minute cleaning buffers</p>
        </div>

        <CounterTimeline
          bookings={todayBookings}
          currentTimeStr={currentTimeStr}
          bufferMinutes={15}
        />
      </div>

      {/* 9. PENDING BALANCES LIST (Private bookings requiring counter settlement) */}
      {pendingBalancesList.length > 0 && (
        <div className="bg-white rounded-[12px] p-4 sm:p-5 border-[0.5px] border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pending balances</h3>
              <p className="text-xs text-slate-500">Private bookings requiring counter settlement</p>
            </div>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-[8px] border-[0.5px] border-rose-200">
              ₹{pendingBalancesList.reduce((sum: number, b: any) => sum + b.balanceDue, 0)} total
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {pendingBalancesList.map((item: any) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900 block">{item.customerName}</span>
                  <span className="text-slate-500 text-[11px]">
                    {item.slotTime} • {item.guestCount} guests • Ref: {item.id}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-rose-600 text-sm block">₹{item.balanceDue}</span>
                  <span className="text-[10px] text-slate-400">Advance ₹{item.advancePaid} paid</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {/* SCREEN 3: WALK-IN SHEET (Tablet checkout: Behance & Square POS pattern) */}
      <WalkInSheetModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        currentOccupancy={publicGauge.currentSwimmers}
        maxCapacity={25}
        isPrivateSessionActive={activeMode === "PRIVATE"}
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

      {/* SCREEN 5: END-OF-DAY REGISTER (Expected vs collected, blind cash entry, variance, pending balances) */}
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
