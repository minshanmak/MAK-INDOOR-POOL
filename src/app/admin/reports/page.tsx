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
  ArrowUpRight,
  PieChart,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Flame,
  Layers,
  Sparkles,
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
  const [hoveredDay, setHoveredDay] = useState<any | null>(null);

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
      // Table tab filter
      if (tableFilter === "FAMILY" && b.type !== "FAMILY") return false;
      if (tableFilter === "PUBLIC" && b.type !== "PUBLIC") return false;
      if (tableFilter === "PENDING_BALANCE" && (b.balanceAmount <= 0 || b.status !== "CONFIRMED"))
        return false;
      if (tableFilter === "CANCELLED" && b.status !== "CANCELLED") return false;

      // Text search query
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

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER & CONTROLS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-700 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4 text-cyan-600" />
            <span>Executive Business Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Reports &amp; Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time financial performance, revenue trends, slot occupancy curves, and customer intelligence.
          </p>
        </div>

        {/* Date Filter Toolbar & Exports */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          {/* Preset Buttons */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "this-month", label: "This Month" },
              { id: "all", label: "All Time" },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeDatePreset === preset.id
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setActiveDatePreset("custom");
                setStartDate(e.target.value);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              title="From Date"
            />
            <span className="text-slate-400 text-xs px-0.5">–</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setActiveDatePreset("custom");
                setEndDate(e.target.value);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              title="To Date"
            />
          </div>

          {/* Export Dropdown / Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadCsv("csv")}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 shrink-0"
              title="Export Bookings CSV with full details"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Bookings CSV</span>
            </button>
            <button
              onClick={() => handleDownloadCsv("payments-csv")}
              className="bg-slate-800 hover:bg-slate-900 text-slate-100 font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 shrink-0"
              title="Export Payment Transactions Ledger"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ledger CSV</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Aggregating real-time business metrics &amp; trends...</span>
        </div>
      ) : (
        <>
          {/* 2. EXECUTIVE KPI CARDS (6 METRICS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Card 1: Net Revenue */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Net Revenue
                </span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <IndianRupee className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                ₹{summary.netRevenue?.toLocaleString("en-IN") || 0}
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                <span>Gross: ₹{summary.totalRevenue?.toLocaleString("en-IN") || 0}</span>
                {summary.refundsApprovedTotal > 0 && (
                  <span className="text-rose-600 font-medium">
                    Refunds: -₹{summary.refundsApprovedTotal}
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Total Swimmers */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Swimmers
                </span>
                <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-cyan-900 tracking-tight font-mono">
                {summary.totalSwimmers || 0}
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                <span>Fam: {summary.familySwimmers || 0}</span>
                <span>Pub: {summary.publicSwimmers || 0}</span>
                <span>Walk: {summary.walkInSwimmers || 0}</span>
              </div>
            </div>

            {/* Card 3: Total Bookings */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Bookings
                </span>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {(summary.familyBookingsCount || 0) + (summary.publicBookingsCount || 0)}
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                <span>Family: {summary.familyBookingsCount || 0}</span>
                <span>Public: {summary.publicBookingsCount || 0}</span>
              </div>
            </div>

            {/* Card 4: Collection Efficiency */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Collection Rate
                </span>
                <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-teal-900 tracking-tight font-mono">
                {summary.collectionEfficiency || 100}%
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${summary.collectionEfficiency || 100}%` }}
                />
              </div>
            </div>

            {/* Card 5: Average Booking Value */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Avg. Booking (ARPB)
                </span>
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                ₹{summary.avgBookingValue?.toLocaleString("en-IN") || 0}
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Avg / Swimmer: ₹{summary.avgSwimmerValue || 0}</span>
              </div>
            </div>

            {/* Card 6: Outstanding Receivables */}
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Due At Arrival
                </span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                  <CreditCard className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-amber-700 tracking-tight font-mono">
                ₹{summary.outstandingBalanceTotal?.toLocaleString("en-IN") || 0}
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Awaiting counter check-in</span>
              </div>
            </div>
          </div>

          {/* 3. INTERACTIVE VISUAL TRENDS & ANALYTICS PANELS */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Visual Tabs Navigation */}
            <div className="border-b border-slate-100 px-6 pt-4 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
              <div className="flex gap-2">
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
                      className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold border-b-2 transition-all ${
                        isActive
                          ? "border-[#00838F] text-[#00838F]"
                          : "border-transparent text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Summary Badge */}
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 pb-2">
                {busiestHour && busiestHour.swimmers > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 font-semibold text-[11px]">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>Prime Slot: <strong>{busiestHour.label}</strong> ({busiestHour.swimmers} swimmers)</span>
                  </span>
                )}
              </div>
            </div>

            {/* TAB CONTENT 1: REVENUE & SWIMMERS TIMELINE */}
            {activeAnalyticsTab === "timeline" && (
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Daily Revenue &amp; Swimmer Volume Distribution
                    </h2>
                    <p className="text-xs text-slate-500">
                      Hover over any day bar to inspect payment method breakdowns, booking volumes, and attendance.
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-[#00838F]" />
                      <span>Online Gateway</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-emerald-600" />
                      <span>UPI</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-indigo-600" />
                      <span>Cash</span>
                    </span>
                  </div>
                </div>

                {dailyTrends.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    No transactions or bookings recorded in this date range.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* SVG / HTML Bar Chart */}
                    <div className="relative pt-6 pb-2 overflow-x-auto">
                      <div className="min-w-[640px] flex items-end justify-between gap-2 h-56 border-b border-slate-200 pb-1">
                        {dailyTrends.map((d: any) => {
                          const heightPct = Math.max(8, Math.round((d.revenue / maxDayRevenue) * 100));
                          const isHovered = hoveredDay?.date === d.date;

                          return (
                            <div
                              key={d.date}
                              onMouseEnter={() => setHoveredDay(d)}
                              onMouseLeave={() => setHoveredDay(null)}
                              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                            >
                              {/* Swimmer badge above bar */}
                              {d.swimmersCount > 0 && (
                                <span className="text-[10px] font-bold font-mono text-slate-500 mb-1 group-hover:text-cyan-700 transition">
                                  {d.swimmersCount}
                                </span>
                              )}

                              {/* Stacked / Proportionate Bar */}
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full max-w-[42px] rounded-t-lg transition-all duration-200 overflow-hidden flex flex-col justify-end ${
                                  isHovered
                                    ? "ring-2 ring-cyan-500 shadow-md scale-[1.03]"
                                    : "opacity-90 hover:opacity-100"
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
                                  <div className="w-full h-full bg-slate-200/80 rounded-t-lg" />
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

                    {/* Interactive Tooltip Card */}
                    {hoveredDay ? (
                      <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-cyan-300 text-sm">
                            {hoveredDay.label} ({hoveredDay.dayName})
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono text-white font-bold">
                            Total Revenue: ₹{hoveredDay.revenue.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-slate-300">
                          <span>
                            Online: <strong className="text-cyan-400">₹{hoveredDay.onlineRevenue}</strong>
                          </span>
                          <span>
                            UPI: <strong className="text-emerald-400">₹{hoveredDay.upiRevenue}</strong>
                          </span>
                          <span>
                            Cash: <strong className="text-indigo-300">₹{hoveredDay.cashRevenue}</strong>
                          </span>
                          <span>
                            Swimmers: <strong className="text-white">{hoveredDay.swimmersCount}</strong>
                          </span>
                          <span>
                            Bookings: <strong className="text-white">{hoveredDay.bookingsCount}</strong>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic text-center py-1">
                        Move your cursor over any bar above to inspect specific date collections and traffic breakdown.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: PEAK HOURS & SLOT OCCUPANCY */}
            {activeAnalyticsTab === "peak-hours" && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Hourly Slot Occupancy &amp; Heatmap (9:00 AM – 10:00 PM)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Identify high-demand slots, evening family surges, and off-peak daytime hours to optimize capacity.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3">
                  {hourlyDistribution.map((slot: any) => {
                    const isBusiest = busiestHour?.slot === slot.slot && slot.swimmers > 0;
                    const fillRatio = Math.round((slot.swimmers / maxSlotSwimmers) * 100);

                    return (
                      <div
                        key={slot.slot}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isBusiest
                            ? "bg-rose-50/60 border-rose-300 shadow-xs ring-1 ring-rose-400"
                            : "bg-slate-50/80 border-slate-200/80 hover:bg-white"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1.5">
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
                          {slot.swimmers} <span className="text-[11px] font-normal text-slate-500">swimmers</span>
                        </div>

                        {/* Density Bar */}
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden my-2">
                          <div
                            className={`h-full rounded-full ${
                              isBusiest
                                ? "bg-rose-500"
                                : slot.swimmers > 0
                                ? "bg-cyan-600"
                                : "bg-slate-300"
                            }`}
                            style={{ width: `${Math.max(4, fillRatio)}%` }}
                          />
                        </div>

                        <div className="text-[10px] text-slate-500 flex justify-between">
                          <span>{slot.bookingsCount} session{slot.bookingsCount !== 1 ? "s" : ""}</span>
                          <span className="font-semibold text-slate-700">₹{slot.revenue}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: DAY OF WEEK CURVE */}
            {activeAnalyticsTab === "day-of-week" && (
              <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Day of Week Aggregate Performance
                    </h2>
                    <p className="text-xs text-slate-500">
                      Compare weekend vs weekday collections and footfall to optimize staff scheduling and capacity.
                    </p>
                  </div>

                  {/* Weekend vs Weekday Split */}
                  <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Weekend (Sat+Sun)
                      </span>
                      <strong className="text-slate-900 font-mono">
                        ₹{weekendRevenue.toLocaleString("en-IN")}
                      </strong>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Weekdays (Mon-Fri)
                      </span>
                      <strong className="text-slate-900 font-mono">
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
                        className={`p-4 rounded-xl border text-center space-y-2 transition ${
                          d.isWeekend
                            ? "bg-cyan-50/40 border-cyan-200"
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
                          <span>{d.swimmersCount} guests</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT 4: PAYMENT & SESSION MIX */}
            {activeAnalyticsTab === "mix" && (
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Payment Methods Breakdown */}
                <div className="p-5 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-cyan-600" />
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Payment Channels
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* Gateway */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">Online Gateway (Card/Net)</span>
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
                        <span className="font-semibold text-slate-700">UPI / QR Counter</span>
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
                        <span className="font-semibold text-slate-700">Counter Cash</span>
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

                {/* 2. Session Type Mix */}
                <div className="p-5 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-600" />
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Session Categories
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Family Exclusive */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-900">Family Exclusive</span>
                        <span className="text-cyan-700 font-mono">
                          ₹{sessionMix.family?.revenue?.toLocaleString("en-IN") || 0}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>{sessionMix.family?.count || 0} sessions booked</span>
                        <span>{sessionMix.family?.swimmers || 0} swimmers ({sessionMix.family?.percentage || 0}%)</span>
                      </div>
                    </div>

                    {/* Public Swimming */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-900">Daytime Public Swimming</span>
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
                    <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-slate-900">Front Desk Walk-ins</span>
                        <span className="text-emerald-700 font-mono">
                          ₹{sessionMix.walkIn?.revenue?.toLocaleString("en-IN") || 0}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>{sessionMix.walkIn?.count || 0} walk-ins</span>
                        <span>{sessionMix.walkIn?.swimmers || 0} swimmers ({sessionMix.walkIn?.percentage || 0}%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Booking Fulfillment & Cancellation Rate */}
                <div className="p-5 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                      Fulfillment Health
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">Active Confirmed</span>
                      <strong className="text-emerald-700 font-mono text-sm">
                        {statusBreakdown.confirmed || 0}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">Successfully Completed</span>
                      <strong className="text-cyan-700 font-mono text-sm">
                        {statusBreakdown.completed || 0}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-slate-600">Cancelled / Refunded</span>
                      <strong className="text-rose-600 font-mono text-sm">
                        {statusBreakdown.cancelled || 0}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-slate-600">Cancellation Rate</span>
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

          {/* 4. DETAILED BOOKINGS AUDIT LEDGER */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-0">
            {/* Table Header with Search & Filter Tabs */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
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

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ID, customer, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#00838F]"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
                        No bookings match the selected criteria.
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

                {/* Table Footer Summary Row */}
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
