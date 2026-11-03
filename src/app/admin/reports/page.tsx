"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  IndianRupee,
  Users,
  CreditCard,
  Clock,
  PieChart,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Flame,
  Layers,
  Sparkles,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { formatSlotTime } from "@/lib/timezone";

type ActiveTab = "timeline" | "peak-hours" | "day-of-week" | "mix";
type TableFilter = "ALL" | "FAMILY" | "PUBLIC" | "PENDING_BALANCE" | "CANCELLED";

export default function AdminReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeDatePreset, setActiveDatePreset] = useState<string>("7d");
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<ActiveTab>("timeline");
  const [tableFilter, setTableFilter] = useState<TableFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDay, setSelectedDay] = useState<any | null>(null);

  // Helper to set preset date ranges in Asia/Kolkata
  const applyPreset = (preset: string) => {
    setActiveDatePreset(preset);
    const now = new Date();

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "today") {
      const d = formatDate(now);
      setStartDate(d);
      setEndDate(d);
    } else if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const d = formatDate(y);
      setStartDate(d);
      setEndDate(d);
    } else if (preset === "7d") {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      setStartDate(formatDate(past));
      setEndDate(formatDate(now));
    } else if (preset === "30d") {
      const past = new Date(now);
      past.setDate(past.getDate() - 29);
      setStartDate(formatDate(past));
      setEndDate(formatDate(now));
    } else if (preset === "this-month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(now));
    } else if (preset === "all") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Initialize with last 7 days preset
  useEffect(() => {
    applyPreset("7d");
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/reports?";
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
      // Auto-select latest day for inspection
      if (json?.dailyTrends?.length > 0) {
        setSelectedDay(json.dailyTrends[json.dailyTrends.length - 1]);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeDatePreset === "custom" && (!startDate || !endDate)) {
      return;
    }
    fetchReport();
  }, [startDate, endDate]);

  const handleDownloadCsv = (format: "csv" | "payments-csv") => {
    let url = `/api/admin/reports?format=${format}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    window.open(url, "_blank");
  };

  const {
    summary = {},
    dailyTrends = [],
    maxDayRevenue = 1,
    hourlyDistribution = [],
    maxSlotSwimmers = 1,
    dayOfWeekTrends = [],
    maxDayOfWeekRevenue = 1,
    sessionMix = {},
    paymentMethods = {},
    statusBreakdown = {},
    bookings = [],
  } = data || {};

  // Filtered Bookings for Table
  const filteredBookings = useMemo(() => {
    return bookings.filter((b: any) => {
      if (tableFilter === "FAMILY" && b.type !== "FAMILY") return false;
      if (tableFilter === "PUBLIC" && b.type !== "PUBLIC") return false;
      if (tableFilter === "PENDING_BALANCE" && (b.balanceAmount <= 0 || b.status !== "CONFIRMED"))
        return false;
      if (tableFilter === "CANCELLED" && b.status !== "CANCELLED") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = b.id?.toLowerCase().includes(q);
        const matchName = b.customerName?.toLowerCase().includes(q);
        const matchPhone = b.customerPhone?.includes(q);
        if (!matchId && !matchName && !matchPhone) return false;
      }

      return true;
    });
  }, [bookings, tableFilter, searchQuery]);

  // Table totals summary
  const tableTotals = useMemo(() => {
    return filteredBookings.reduce(
      (acc: any, b: any) => ({
        guests: acc.guests + (b.guestCount || 0),
        total: acc.total + (b.totalAmount || 0),
        paid: acc.paid + (b.totalPaid || 0),
        balance: acc.balance + (b.balanceAmount || 0),
      }),
      { guests: 0, total: 0, paid: 0, balance: 0 }
    );
  }, [filteredBookings]);

  // Find peak hour
  const busiestHour = useMemo(() => {
    if (!hourlyDistribution.length) return null;
    return [...hourlyDistribution].sort((a, b) => b.swimmers - a.swimmers)[0];
  }, [hourlyDistribution]);

  // Group slots by operational periods
  const morningSlots = useMemo(() => {
    return hourlyDistribution.filter((s: any) => {
      const h = parseInt(s.slot.split(":")[0], 10);
      return h >= 9 && h < 12;
    });
  }, [hourlyDistribution]);

  const afternoonSlots = useMemo(() => {
    return hourlyDistribution.filter((s: any) => {
      const h = parseInt(s.slot.split(":")[0], 10);
      return h >= 12 && h < 16;
    });
  }, [hourlyDistribution]);

  const eveningSlots = useMemo(() => {
    return hourlyDistribution.filter((s: any) => {
      const h = parseInt(s.slot.split(":")[0], 10);
      return h >= 16;
    });
  }, [hourlyDistribution]);

  // Weekend vs Weekday revenue
  const weekendRevenue = useMemo(() => {
    return (
      dayOfWeekTrends
        .filter((d: any) => d.isWeekend)
        .reduce((s: number, d: any) => s + d.revenue, 0) || 0
    );
  }, [dayOfWeekTrends]);

  const weekdayRevenue = useMemo(() => {
    return (
      dayOfWeekTrends
        .filter((d: any) => !d.isWeekend)
        .reduce((s: number, d: any) => s + d.revenue, 0) || 0
    );
  }, [dayOfWeekTrends]);

  // Peak day in trends
  const peakDay = useMemo(() => {
    if (!dailyTrends.length) return null;
    return [...dailyTrends].sort((a, b) => b.revenue - a.revenue)[0];
  }, [dailyTrends]);

  return (
    <div className="space-y-4 pb-12 text-slate-800">
      {/* 1. TOP SUB-TABS & EXPORT ACTIONS (Exact Mockup Match) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Sub-tabs matching Image 2 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["Revenue", "Bookings", "Walk-ins", "Cancellations", "Refunds", "Staff"].map((tabName, idx) => (
            <button
              key={tabName}
              type="button"
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                idx === 0
                  ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
              }`}
            >
              {tabName}
            </button>
          ))}
        </div>

        {/* Export Actions (Apple Pill Buttons) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleDownloadCsv("csv")}
            className="flex-1 sm:flex-none bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold px-3.5 py-2 rounded-2xl text-xs border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)] transition flex items-center justify-center gap-1.5"
            title="Download Bookings CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-extrabold px-4 py-2 rounded-2xl text-xs shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-1.5"
          >
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Date Presets Strip */}
      <div className="bg-white rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] p-4">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3">
          {/* Preset Buttons Strip (iOS Segmented Switcher) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-semibold overflow-x-auto w-full xl:w-auto">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7d", label: "Last 7 Days" },
              { id: "30d", label: "Last 30 Days" },
              { id: "this-month", label: "This Month" },
              { id: "all", label: "All Time" },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-all active:scale-95 ${
                  activeDatePreset === preset.id
                    ? "bg-white text-slate-900 shadow-xs font-bold ring-1 ring-black/5"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers & Refresh Button */}
          <div className="flex items-center gap-2.5 w-full xl:w-auto">
            <div className="flex items-center gap-2 bg-slate-50/80 px-3.5 py-2 rounded-full border border-slate-200 text-xs text-slate-600 w-full sm:w-auto">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setActiveDatePreset("custom");
                  setStartDate(e.target.value);
                }}
                className="bg-transparent font-medium text-slate-800 focus:outline-none"
                title="Start Date"
              />
              <span className="text-slate-400 font-bold">–</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setActiveDatePreset("custom");
                  setEndDate(e.target.value);
                }}
                className="bg-transparent font-medium text-slate-800 focus:outline-none"
                title="End Date"
              />
            </div>

            <button
              onClick={fetchReport}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-600" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 border-2 border-[#00838F] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Recalculating real-time pool metrics &amp; timeline trends...</span>
        </div>
      ) : (
        <>
          {/* 2. EXECUTIVE 6-CARD KPI GRID (Responsive 3x2, iOS Health & Fitness Widget Style) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* KPI 1: Net Realized Revenue */}
            <div className="bg-white p-5 rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500">
                  Net Realized Revenue
                </span>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs">
                  <IndianRupee className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                ₹{summary.netRevenue?.toLocaleString("en-IN") || 0}
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between items-center">
                <span>Gross: <strong>₹{summary.totalRevenue?.toLocaleString("en-IN") || 0}</strong></span>
                {summary.refundsApprovedTotal > 0 ? (
                  <span className="text-rose-600 font-semibold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                    Refunds: -₹{summary.refundsApprovedTotal}
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold">Zero refunds</span>
                )}
              </div>
            </div>

            {/* KPI 2: Total Swimmers Attended */}
            <div className="bg-white p-5 rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500">
                  Total Swimmers
                </span>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-cyan-900 tracking-tight font-mono">
                {summary.totalSwimmers || 0}
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between items-center">
                <span>Family: <strong>{summary.familySwimmers || 0}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Public: <strong>{summary.publicSwimmers || 0}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Walk-in: <strong>{summary.walkInSwimmers || 0}</strong></span>
              </div>
            </div>

            {/* KPI 3: Total Sessions Booked */}
            <div className="bg-white p-5 rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500">
                  Total Booked Sessions
                </span>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {(summary.familyBookingsCount || 0) + (summary.publicBookingsCount || 0)}
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between items-center">
                <span>Family Exclusive: <strong>{summary.familyBookingsCount || 0}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Public Swim: <strong>{summary.publicBookingsCount || 0}</strong></span>
              </div>
            </div>

            {/* KPI 4: Collection Efficiency */}
            <div className="bg-white p-5 rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500">
                  Collection Rate
                </span>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-black text-teal-900 tracking-tight font-mono">
                  {summary.collectionEfficiency || 100}%
                </div>
                <span className="text-xs text-slate-500 font-medium">collected upfront</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.collectionEfficiency || 100}%` }}
                />
              </div>
            </div>

            {/* KPI 5: Average Booking Value (ARPB) */}
            <div className="bg-white p-5 rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500">
                  Avg. Spend / Session
                </span>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                ₹{summary.avgBookingValue?.toLocaleString("en-IN") || 0}
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between items-center">
                <span>Avg per swimmer: <strong>₹{summary.avgSwimmerValue || 0}</strong></span>
              </div>
            </div>

            {/* KPI 6: Outstanding Balance Due At Arrival */}
            <div className="bg-white p-5 rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-500">
                  Counter Receivables
                </span>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-black text-amber-700 tracking-tight font-mono">
                ₹{summary.outstandingBalanceTotal?.toLocaleString("en-IN") || 0}
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between items-center">
                <span>To be collected upon check-in</span>
              </div>
            </div>
          </div>

          {/* 3. VISUAL ANALYTICS PANELS (WITH CRISP NAVIGATION) */}
          <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Visual Tabs Navigation */}
            <div className="border-b border-slate-200/80 px-4 sm:px-6 pt-3 flex flex-wrap gap-2 justify-between items-center bg-slate-50/60">
              <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                {[
                  { id: "timeline", label: "Revenue & Swimmers Timeline", icon: TrendingUp },
                  { id: "peak-hours", label: "Peak Hours & Slot Occupancy", icon: Clock },
                  { id: "day-of-week", label: "Day of Week Curve", icon: BarChart3 },
                  { id: "mix", label: "Payment & Session Mix", icon: PieChart },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeAnalyticsTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveAnalyticsTab(tab.id as ActiveTab)}
                      className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                        isActive
                          ? "border-[#00838F] text-[#00838F] bg-white rounded-t-lg shadow-xs"
                          : "border-transparent text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Prime Slot Flag */}
              {busiestHour && busiestHour.swimmers > 0 && (
                <div className="hidden lg:flex items-center gap-2 text-xs py-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 font-bold text-[11px]">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>Peak Slot: {busiestHour.label} ({busiestHour.swimmers} swimmers)</span>
                  </span>
                </div>
              )}
            </div>

            {/* TAB 1: REVENUE & SWIMMERS TIMELINE */}
            {activeAnalyticsTab === "timeline" && (
              <div className="p-5 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Daily Revenue &amp; Attendance Trend
                    </h2>
                    <p className="text-xs text-slate-500">
                      Tap or hover any day bar to inspect payment channels and attendance volume.
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-3.5 text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-[#00838F]" />
                      <span>Online Gateway</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-emerald-600" />
                      <span>Counter UPI</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-indigo-600" />
                      <span>Counter Cash</span>
                    </span>
                  </div>
                </div>

                {dailyTrends.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    No transactions or bookings recorded in this date range.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Bar Chart Canvas */}
                    <div className="pt-6 pb-2 overflow-x-auto">
                      <div className="min-w-[620px] flex items-end justify-between gap-2.5 h-60 border-b border-slate-200 pb-1">
                        {dailyTrends.map((d: any) => {
                          const heightPct = Math.max(10, Math.round((d.revenue / maxDayRevenue) * 100));
                          const isSelected = selectedDay?.date === d.date;

                          return (
                            <div
                              key={d.date}
                              onClick={() => setSelectedDay(d)}
                              onMouseEnter={() => setSelectedDay(d)}
                              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                            >
                              {/* Swimmer badge above bar */}
                              <span className="text-[10px] font-bold font-mono text-slate-500 mb-1 group-hover:text-cyan-700 transition">
                                {d.swimmersCount > 0 ? d.swimmersCount : "–"}
                              </span>

                              {/* Stacked Bar */}
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full max-w-[44px] rounded-t-lg transition-all duration-150 overflow-hidden flex flex-col justify-end ${
                                  isSelected
                                    ? "ring-2 ring-[#00838F] shadow-md scale-[1.04]"
                                    : "opacity-85 hover:opacity-100"
                                }`}
                              >
                                {d.revenue > 0 ? (
                                  <>
                                    <div
                                      style={{
                                        height: `${(d.onlineRevenue / d.revenue) * 100}%`,
                                      }}
                                      className="bg-[#00838F] w-full"
                                      title={`Online: ₹${d.onlineRevenue}`}
                                    />
                                    <div
                                      style={{
                                        height: `${(d.upiRevenue / d.revenue) * 100}%`,
                                      }}
                                      className="bg-emerald-600 w-full"
                                      title={`UPI: ₹${d.upiRevenue}`}
                                    />
                                    <div
                                      style={{
                                        height: `${(d.cashRevenue / d.revenue) * 100}%`,
                                      }}
                                      className="bg-indigo-600 w-full"
                                      title={`Cash: ₹${d.cashRevenue}`}
                                    />
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-slate-200/70 rounded-t-lg" />
                                )}
                              </div>

                              {/* Day & Date Labels */}
                              <div className="mt-2 text-center">
                                <span className="block text-[10px] font-bold text-slate-700">
                                  {d.dayName}
                                </span>
                                <span className="block text-[9px] text-slate-400 font-mono">
                                  {d.date.slice(8)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Inspector Details Box */}
                    {selectedDay && (
                      <div className="p-4 bg-slate-900 text-slate-100 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-cyan-300 text-sm">
                            {selectedDay.label} ({selectedDay.dayName})
                          </span>
                          <span className="text-slate-600">|</span>
                          <span className="font-mono text-white font-bold text-sm">
                            Total Revenue: ₹{selectedDay.revenue.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-slate-300 text-[11px]">
                          <span>
                            Online: <strong className="text-cyan-400 font-mono">₹{selectedDay.onlineRevenue}</strong>
                          </span>
                          <span>
                            UPI: <strong className="text-emerald-400 font-mono">₹{selectedDay.upiRevenue}</strong>
                          </span>
                          <span>
                            Cash: <strong className="text-indigo-300 font-mono">₹{selectedDay.cashRevenue}</strong>
                          </span>
                          <span>
                            Swimmers: <strong className="text-white font-mono">{selectedDay.swimmersCount}</strong>
                          </span>
                          <span>
                            Bookings: <strong className="text-white font-mono">{selectedDay.bookingsCount}</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Summary Quick Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-slate-500 block text-[11px]">Peak Collection Day</span>
                        <strong className="text-slate-900 font-bold">
                          {peakDay ? `${peakDay.label} (₹${peakDay.revenue.toLocaleString("en-IN")})` : "N/A"}
                        </strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-slate-500 block text-[11px]">Daily Average Revenue</span>
                        <strong className="text-slate-900 font-bold">
                          ₹{dailyTrends.length > 0 ? Math.round(summary.totalRevenue / dailyTrends.length).toLocaleString("en-IN") : 0} / day
                        </strong>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <span className="text-slate-500 block text-[11px]">Daily Average Swimmers</span>
                        <strong className="text-slate-900 font-bold">
                          {dailyTrends.length > 0 ? Math.round(summary.totalSwimmers / dailyTrends.length) : 0} swimmers / day
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PEAK HOURS & SLOT OCCUPANCY */}
            {activeAnalyticsTab === "peak-hours" && (
              <div className="p-5 sm:p-6 space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Hourly Slot Occupancy &amp; Density Heatmap
                  </h2>
                  <p className="text-xs text-slate-500">
                    Arranged by facility operating shifts (Morning Public, Afternoon Public, and Evening Family Exclusive).
                  </p>
                </div>

                {/* Period 1: Morning Public Swimming */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Morning Public Swimming (09:00 AM – 12:00 PM)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {morningSlots.map((slot: any) => {
                      const isBusiest = busiestHour?.slot === slot.slot && slot.swimmers > 0;
                      const fillRatio = Math.round((slot.swimmers / maxSlotSwimmers) * 100);

                      return (
                        <div
                          key={slot.slot}
                          className={`p-4 rounded-xl border transition-all ${
                            isBusiest
                              ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-400"
                              : "bg-slate-50/70 border-slate-200/80 hover:bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {slot.label}
                            </span>
                            {isBusiest && (
                              <span className="text-[9px] font-bold uppercase bg-rose-600 text-white px-1.5 py-0.5 rounded">
                                #1 Peak Slot
                              </span>
                            )}
                          </div>
                          <div className="text-2xl font-black text-slate-900 font-mono">
                            {slot.swimmers} <span className="text-xs font-normal text-slate-500">swimmers</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden my-2">
                            <div
                              className={`h-full rounded-full ${
                                isBusiest ? "bg-rose-500" : slot.swimmers > 0 ? "bg-cyan-600" : "bg-slate-300"
                              }`}
                              style={{ width: `${Math.max(4, fillRatio)}%` }}
                            />
                          </div>
                          <div className="text-[11px] text-slate-500 flex justify-between">
                            <span>{slot.bookingsCount} booking{slot.bookingsCount !== 1 ? "s" : ""}</span>
                            <span className="font-semibold text-slate-800">₹{slot.revenue}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Period 2: Afternoon Public Swimming */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Sunset className="w-4 h-4 text-orange-500" />
                    <span>Afternoon Public Swimming (12:00 PM – 04:00 PM)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {afternoonSlots.map((slot: any) => {
                      const isBusiest = busiestHour?.slot === slot.slot && slot.swimmers > 0;
                      const fillRatio = Math.round((slot.swimmers / maxSlotSwimmers) * 100);

                      return (
                        <div
                          key={slot.slot}
                          className={`p-4 rounded-xl border transition-all ${
                            isBusiest
                              ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-400"
                              : "bg-slate-50/70 border-slate-200/80 hover:bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {slot.label}
                            </span>
                            {isBusiest && (
                              <span className="text-[9px] font-bold uppercase bg-rose-600 text-white px-1.5 py-0.5 rounded">
                                #1 Peak Slot
                              </span>
                            )}
                          </div>
                          <div className="text-2xl font-black text-slate-900 font-mono">
                            {slot.swimmers} <span className="text-xs font-normal text-slate-500">swimmers</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden my-2">
                            <div
                              className={`h-full rounded-full ${
                                isBusiest ? "bg-rose-500" : slot.swimmers > 0 ? "bg-cyan-600" : "bg-slate-300"
                              }`}
                              style={{ width: `${Math.max(4, fillRatio)}%` }}
                            />
                          </div>
                          <div className="text-[11px] text-slate-500 flex justify-between">
                            <span>{slot.bookingsCount} booking{slot.bookingsCount !== 1 ? "s" : ""}</span>
                            <span className="font-semibold text-slate-800">₹{slot.revenue}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Period 3: Evening Family Exclusive */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <Moon className="w-4 h-4 text-cyan-600" />
                    <span>Evening Family Exclusive (04:00 PM – 11:00 PM)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                    {eveningSlots.map((slot: any) => {
                      const isBusiest = busiestHour?.slot === slot.slot && slot.swimmers > 0;
                      const fillRatio = Math.round((slot.swimmers / maxSlotSwimmers) * 100);

                      return (
                        <div
                          key={slot.slot}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isBusiest
                              ? "bg-rose-50/70 border-rose-300 ring-1 ring-rose-400"
                              : "bg-slate-50/70 border-slate-200/80 hover:bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {slot.label}
                            </span>
                            {isBusiest && (
                              <span className="text-[9px] font-bold uppercase bg-rose-600 text-white px-1.5 py-0.5 rounded">
                                Top Slot
                              </span>
                            )}
                          </div>
                          <div className="text-xl font-black text-slate-900 font-mono">
                            {slot.swimmers} <span className="text-[10px] font-normal text-slate-500">swimmers</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden my-2">
                            <div
                              className={`h-full rounded-full ${
                                isBusiest ? "bg-rose-500" : slot.swimmers > 0 ? "bg-teal-600" : "bg-slate-300"
                              }`}
                              style={{ width: `${Math.max(4, fillRatio)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 flex justify-between">
                            <span>{slot.bookingsCount} fam</span>
                            <span className="font-semibold text-slate-800">₹{slot.revenue}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DAY OF WEEK CURVE */}
            {activeAnalyticsTab === "day-of-week" && (
              <div className="p-5 sm:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Day of Week Aggregate Volume &amp; Collections
                    </h2>
                    <p className="text-xs text-slate-500">
                      Identifies weekly customer traffic patterns to plan lifeguards, water treatments, and rates.
                    </p>
                  </div>

                  {/* Split Tag */}
                  <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Weekend (Sat + Sun)
                      </span>
                      <strong className="text-slate-900 font-mono text-sm">
                        ₹{weekendRevenue.toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <span className="text-slate-300 text-base">|</span>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Weekdays (Mon – Fri)
                      </span>
                      <strong className="text-slate-900 font-mono text-sm">
                        ₹{weekdayRevenue.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {dayOfWeekTrends.map((d: any) => {
                    const pct = Math.round((d.revenue / maxDayOfWeekRevenue) * 100);

                    return (
                      <div
                        key={d.dayName}
                        className={`p-4 rounded-xl border text-center space-y-2.5 transition ${
                          d.isWeekend
                            ? "bg-cyan-50/40 border-cyan-200 shadow-xs"
                            : "bg-slate-50/60 border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">
                            {d.dayName}
                          </span>
                          {d.isWeekend && (
                            <span className="text-[9px] font-bold uppercase bg-cyan-600 text-white px-1.5 py-0.5 rounded">
                              Weekend
                            </span>
                          )}
                        </div>

                        <div className="text-xl font-black text-slate-900 font-mono">
                          ₹{d.revenue.toLocaleString("en-IN")}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              d.isWeekend ? "bg-cyan-600" : "bg-slate-600"
                            }`}
                            style={{ width: `${Math.max(5, pct)}%` }}
                          />
                        </div>

                        <div className="text-[11px] text-slate-500 pt-1 flex justify-between">
                          <span>{d.bookingsCount} slots</span>
                          <span className="font-semibold text-slate-700">{d.swimmersCount} guests</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: PAYMENT & SESSION MIX */}
            {activeAnalyticsTab === "mix" && (
              <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Payment Channels */}
                <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#00838F]" />
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Financial Collection Channels
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    {/* Gateway */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Online Gateway (Cards / Net)</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{paymentMethods.gateway?.amount?.toLocaleString("en-IN") || 0} ({paymentMethods.gateway?.percentage || 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#00838F] h-full rounded-full"
                          style={{ width: `${paymentMethods.gateway?.percentage || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* UPI */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Counter UPI / Dynamic QR</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{paymentMethods.upi?.amount?.toLocaleString("en-IN") || 0} ({paymentMethods.upi?.percentage || 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full"
                          style={{ width: `${paymentMethods.upi?.percentage || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Cash */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Counter Physical Cash</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{paymentMethods.cash?.amount?.toLocaleString("en-IN") || 0} ({paymentMethods.cash?.percentage || 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${paymentMethods.cash?.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Session Categories */}
                <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#00838F]" />
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Session Revenue &amp; Headcount
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Family Exclusive */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-teal-900">Family Exclusive</span>
                        <span className="text-teal-800 font-mono">
                          ₹{sessionMix.family?.revenue?.toLocaleString("en-IN") || 0}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>{sessionMix.family?.count || 0} slots reserved</span>
                        <span>{sessionMix.family?.swimmers || 0} swimmers ({sessionMix.family?.percentage || 0}%)</span>
                      </div>
                    </div>

                    {/* Public Swimming */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-sky-900">Daytime Public Swimming</span>
                        <span className="text-slate-900 font-mono">
                          ₹{sessionMix.public?.revenue?.toLocaleString("en-IN") || 0}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>{sessionMix.public?.count || 0} bookings</span>
                        <span>{sessionMix.public?.swimmers || 0} swimmers ({sessionMix.public?.percentage || 0}%)</span>
                      </div>
                    </div>

                    {/* Walk-ins */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-emerald-900">Front Desk Walk-ins</span>
                        <span className="text-emerald-700 font-mono">
                          ₹{sessionMix.walkIn?.revenue?.toLocaleString("en-IN") || 0}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>{sessionMix.walkIn?.count || 0} walk-in parties</span>
                        <span>{sessionMix.walkIn?.swimmers || 0} swimmers ({sessionMix.walkIn?.percentage || 0}%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Fulfillment Health */}
                <div className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Fulfillment &amp; Retention
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-slate-200/80">
                      <span className="text-slate-600 font-medium">Active Confirmed</span>
                      <strong className="text-emerald-700 font-mono text-sm">
                        {statusBreakdown.confirmed || 0}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-200/80">
                      <span className="text-slate-600 font-medium">Completed Sessions</span>
                      <strong className="text-cyan-800 font-mono text-sm">
                        {statusBreakdown.completed || 0}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-200/80">
                      <span className="text-slate-600 font-medium">Cancelled Bookings</span>
                      <strong className="text-rose-600 font-mono text-sm">
                        {statusBreakdown.cancelled || 0}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-600 font-medium">Cancellation Rate</span>
                      <strong className={`font-mono text-sm ${
                        statusBreakdown.cancellationRate > 15 ? "text-rose-600" : "text-slate-800"
                      }`}>
                        {statusBreakdown.cancellationRate || 0}%
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. COMPREHENSIVE BOOKINGS AUDIT LEDGER */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Table Header Filter Toolbar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/40">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "ALL", label: `All (${bookings.length})` },
                  { id: "FAMILY", label: `Family (${summary.familyBookingsCount || 0})` },
                  { id: "PUBLIC", label: `Public (${summary.publicBookingsCount || 0})` },
                  { id: "PENDING_BALANCE", label: "Pending Balances" },
                  { id: "CANCELLED", label: `Cancelled (${statusBreakdown.cancelled || 0})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTableFilter(tab.id as TableFilter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      tableFilter === tab.id
                        ? "bg-[#00838F] text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Booking ID, name, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00838F]"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Booking ID</th>
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Guests</th>
                    <th className="px-4 py-3">Total Amount</th>
                    <th className="px-4 py-3">Paid (Advance)</th>
                    <th className="px-4 py-3">Counter Balance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                        No bookings match the current filter selection.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-cyan-800">
                          {b.id}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900 block">
                            {b.bookingDate}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {formatSlotTime(b.startTime)} – {formatSlotTime(b.endTime)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.type === "FAMILY"
                                ? "bg-teal-50 text-teal-800 border border-teal-200/60"
                                : "bg-sky-50 text-sky-800 border border-sky-200/60"
                            }`}
                          >
                            {b.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{b.customerName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {b.customerPhone}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">
                          {b.guestCount}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          ₹{b.totalAmount}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                          ₹{b.totalPaid}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold">
                          {b.balanceAmount > 0 ? (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                              ₹{b.balanceAmount}
                            </span>
                          ) : (
                            <span className="text-slate-400">₹0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                              b.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "COMPLETED"
                                ? "bg-cyan-100 text-cyan-800"
                                : b.status === "CANCELLED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {/* Table Footer Totals */}
                {filteredBookings.length > 0 && (
                  <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 text-xs font-bold text-slate-900">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right uppercase text-[11px] text-slate-500">
                        Total for Listed ({filteredBookings.length} records):
                      </td>
                      <td className="px-4 py-3 font-mono text-cyan-900">
                        {tableTotals.guests} guests
                      </td>
                      <td className="px-4 py-3 font-mono">
                        ₹{tableTotals.total.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-mono text-emerald-700">
                        ₹{tableTotals.paid.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-mono text-amber-700">
                        ₹{tableTotals.balance.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
