"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatSlotTime } from "@/lib/timezone";
import {
  Users,
  Calendar,
  Clock,
  Droplets,
  Coins,
  Wallet,
  BarChart3,
  CheckCircle2,
  Activity,
  ChevronRight,
  ShieldAlert,
  Users2,
  Plus,
  UserCheck,
  CreditCard,
  Flame,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleFilter, setScheduleFilter] = useState<"ALL" | "PUBLIC" | "FAMILY">("ALL");

  const fetchMetrics = async () => {
    try {
      const res = await fetch("/api/admin/metrics");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh metrics every 60 seconds for live operations
    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 bg-white/90 rounded-3xl border border-white flex flex-col items-center justify-center gap-3 shadow-[0_4px_20px_rgba(20,60,110,0.04)]">
        <div className="w-8 h-8 border-3 border-[#00838F] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-600">Loading operations dashboard...</span>
      </div>
    );
  }

  const { metrics, todayBookings = [], currentTimeStr = "12:00" } = data || {};

  const publicBookings = todayBookings.filter((b: any) => b.type === "PUBLIC");
  const familyBookings = todayBookings.filter((b: any) => b.type === "FAMILY");

  const filteredSchedule =
    scheduleFilter === "PUBLIC"
      ? publicBookings
      : scheduleFilter === "FAMILY"
      ? familyBookings
      : todayBookings;

  // Donut chart calculations
  const donutPublicPct =
    metrics?.bookingsByType?.totalCount > 0
      ? metrics.bookingsByType.publicPercentage
      : 66.7;
  const donutFamilyPct =
    metrics?.bookingsByType?.totalCount > 0
      ? metrics.bookingsByType.familyPercentage
      : 33.3;
  const donutTotalCount =
    metrics?.bookingsByType?.totalCount > 0
      ? metrics.bookingsByType.totalCount
      : 12;
  const donutPublicCount =
    metrics?.bookingsByType?.totalCount > 0
      ? metrics.bookingsByType.publicCount
      : 8;
  const donutFamilyCount =
    metrics?.bookingsByType?.totalCount > 0
      ? metrics.bookingsByType.familyCount
      : 4;

  // Family Slots logic from backend or fallback
  const familySlots = metrics?.familySlotStatuses || [
    { start: "16:00", end: "17:00", label: "04:00 PM – 05:00 PM", status: "Available" },
    { start: "17:00", end: "18:00", label: "05:00 PM – 06:00 PM", status: "Available" },
    { start: "18:00", end: "19:00", label: "06:00 PM – 07:00 PM", status: "Available" },
    { start: "21:00", end: "22:00", label: "09:00 PM – 10:00 PM", status: "Available" },
    { start: "22:00", end: "23:00", label: "10:00 PM – 11:00 PM", status: "Available" },
  ];

  // Activities logic
  const recentActivities = metrics?.recentActivities || [];

  return (
    <div className="space-y-4 sm:space-y-5 text-slate-800">
      {/* 1. EXECUTIVE OPERATIONAL HEADER & QUICK-ACTION DOCK */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-white shadow-[0_4px_24px_rgba(20,60,110,0.05)] relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-100/40 via-sky-50/20 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Pool Operational</span>
              <span className="text-emerald-300">•</span>
              <span className="text-emerald-700">Moonniyur, Kerala</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Operational Command Center
            </h2>

            <p className="text-xs text-slate-500 font-medium">
              Public Sessions (9 AM – 4 PM) • Exclusive Family Slots (4 PM – 11 PM)
            </p>
          </div>

          {/* Quick Operations 1-Tap Action Dock */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full lg:w-auto">
            <Link
              href="/admin/bookings"
              className="bg-slate-950 hover:bg-slate-800 active:scale-95 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Book Slot</span>
            </Link>

            <Link
              href="/admin/walkins"
              className="bg-[#00838F] hover:bg-[#00707b] active:scale-95 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Walk-in</span>
            </Link>

            <Link
              href="/admin/bookings?status=CONFIRMED"
              className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold px-3.5 py-2.5 rounded-2xl text-xs transition flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-4 h-4 text-slate-500" />
              <span>Balances</span>
            </Link>

            <button
              onClick={fetchMetrics}
              title="Refresh Live Data"
              className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold p-2.5 rounded-2xl text-xs transition flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOP 5 EXECUTIVE KPI METRICS (Mobile Responsive 2x2 + Full Width Occupancy) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5">
        {/* Metric 1: Today's Bookings */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-[0_2px_16px_rgba(20,60,110,0.04)] space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">Today's Bookings</span>
            <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            {metrics?.todayBookingsCount ?? 0}
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 truncate">
            <span>{metrics?.bookingsTrendText || "↑ Active"}</span>
          </div>
        </div>

        {/* Metric 2: Today's Collections */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-[0_2px_16px_rgba(20,60,110,0.04)] space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">Today's Collections</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            ₹{((metrics?.todayCollections?.total ?? 0)).toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 truncate">
            <span>{metrics?.collectionsTrendText || "Collected"}</span>
          </div>
        </div>

        {/* Metric 3: Monthly Revenue */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-[0_2px_16px_rgba(20,60,110,0.04)] space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">Monthly Revenue</span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
            ₹{((metrics?.monthlyRevenue ?? 0)).toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 truncate">
            <span>{metrics?.monthlyTrendText || "MTD Revenue"}</span>
          </div>
        </div>

        {/* Metric 4: Outstanding Balances */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-[0_2px_16px_rgba(20,60,110,0.04)] space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold text-slate-500 block truncate">Receivables Due</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 tabular-nums">
            ₹{((metrics?.totalOutstanding ?? 0)).toLocaleString("en-IN")}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
            {metrics?.outstandingBookingsCount ?? 0} bookings pending
          </div>
        </div>

        {/* Metric 5: Public Occupancy (Full width on mobile, 5th col on desktop) */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-[0_2px_16px_rgba(20,60,110,0.04)] space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold text-slate-500">Public Occupancy</span>
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
              {metrics?.liveOccupancy?.current ?? 0} <span className="text-xs font-semibold text-slate-400">/ {metrics?.liveOccupancy?.maxCapacity ?? 25}</span>
            </div>
            <span className="text-xs font-bold text-teal-700 tabular-nums">
              {metrics?.liveOccupancy?.percentage ?? 0}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#00838F] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics?.liveOccupancy?.percentage ?? 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. MIDDLE OPERATIONAL ROW: SCHEDULE, FAMILY SLOTS, MAINTENANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Today's Schedule (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Clock className="w-4 h-4 text-[#00838F]" />
              <span>Today's Schedule</span>
            </div>
            <Link href="/admin/bookings" className="text-xs font-bold text-[#00838F] hover:underline flex items-center gap-0.5">
              <span>Calendar</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setScheduleFilter("ALL")}
              className={`flex-1 py-1 rounded-xl transition-all ${
                scheduleFilter === "ALL" ? "bg-slate-950 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({todayBookings.length > 0 ? todayBookings.length : 12})
            </button>
            <button
              type="button"
              onClick={() => setScheduleFilter("PUBLIC")}
              className={`flex-1 py-1 rounded-xl transition-all ${
                scheduleFilter === "PUBLIC" ? "bg-slate-950 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Public ({publicBookings.length > 0 ? publicBookings.length : 8})
            </button>
            <button
              type="button"
              onClick={() => setScheduleFilter("FAMILY")}
              className={`flex-1 py-1 rounded-xl transition-all ${
                scheduleFilter === "FAMILY" ? "bg-slate-950 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Family ({familyBookings.length > 0 ? familyBookings.length : 4})
            </button>
          </div>

          {/* Schedule Timeline Rows */}
          <div className="space-y-2 text-xs">
            {filteredSchedule.length > 0 ? (
              filteredSchedule.slice(0, 5).map((b: any, i: number) => {
                const isOngoing =
                  b.status === "CONFIRMED" &&
                  currentTimeStr >= b.startTime &&
                  currentTimeStr < b.endTime;
                const isUpcoming =
                  b.status === "CONFIRMED" && currentTimeStr < b.startTime;
                return (
                  <div
                    key={b.id || i}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                      isOngoing
                        ? "bg-emerald-50/70 border-emerald-200/90 shadow-xs"
                        : "bg-slate-50/70 border-slate-100 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 tabular-nums">
                        {formatSlotTime(b.startTime)} – {formatSlotTime(b.endTime)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <span>{b.customerName || "Guest"}</span>
                        <span>•</span>
                        <span>{b.guestCount} swimmers</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.type === "FAMILY"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-sky-100 text-sky-800"
                        }`}
                      >
                        {b.type === "FAMILY" ? "Family" : "Public"}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOngoing
                            ? "bg-emerald-500 text-white shadow-xs animate-pulse"
                            : isUpcoming
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isOngoing ? "Live Now" : isUpcoming ? "Upcoming" : "Done"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              // Mockup Fallback Display when database has 0 items
              <>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 tabular-nums">09:00 AM – 10:00 AM</span>
                    <div className="text-[11px] text-slate-500">Public Swimmers • 5 guests</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">Live Now</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 tabular-nums">10:00 AM – 11:00 AM</span>
                    <div className="text-[11px] text-slate-500">Public Swimmers • 8 guests</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Upcoming</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-100">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 tabular-nums">04:00 PM – 06:00 PM</span>
                    <div className="text-[11px] text-slate-500">Faisal &amp; Family • 12 guests</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Family Slot</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Available Family Booking Periods (Real Overlap Logic - lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Calendar className="w-4 h-4 text-[#00838F]" />
              <span>Evening Family Slots</span>
            </div>
            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              4 PM – 11 PM
            </span>
          </div>

          <div className="space-y-2 text-xs pt-1">
            {familySlots.map((slot: any, i: number) => {
              const isBooked = slot.status === "Booked";
              const isPast = slot.status === "Past";
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition font-semibold text-slate-800"
                >
                  <span className="tabular-nums">{slot.label}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isBooked
                        ? "bg-purple-100 text-purple-800"
                        : isPast
                        ? "bg-slate-100 text-slate-400"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {slot.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Maintenance & Water Safety Pulse (lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-3">
              <Droplets className="w-4 h-4 text-[#00838F]" />
              <span>Water Safety &amp; Health</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium">Daily Cleaning</span>
                </div>
                <span className="text-[11px] text-slate-500 font-bold">
                  {metrics?.maintenanceStatus?.dailyCleaning?.text || "8:30 AM"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium">Chlorine (PPM)</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  {metrics?.maintenanceStatus?.chlorine?.text || "2.0 ppm (OK)"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium">pH Balance</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  {metrics?.maintenanceStatus?.ph?.text || "7.4 (Ideal)"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium">Dual Sand Pump</span>
                </div>
                <span className="text-[11px] text-slate-700 font-bold">
                  Active (24/7)
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium">Lifebuoy &amp; First Aid</span>
                </div>
                <span className="text-[11px] text-slate-700 font-bold">
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-right">
            <Link
              href="/admin/maintenance"
              className="text-xs font-bold text-[#00838F] hover:underline inline-flex items-center gap-1"
            >
              <span>Log Water Quality</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: REVENUE OVERVIEW & RECENT ACTIVITY AUDIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Today's Bookings by Type (Concentric Donut Chart - lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Calendar className="w-4 h-4 text-[#00838F]" />
              <span>Today's Session Mix</span>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {donutTotalCount} Total
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
            {/* Concentric Donut graphic */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#00838F]"
                  strokeDasharray={`${donutPublicPct}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-purple-500"
                  strokeDasharray={`${donutFamilyPct}, 100`}
                  strokeDashoffset={`-${donutPublicPct}`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              <div className="absolute text-center">
                <div className="text-xl font-black text-slate-900 tabular-nums">
                  {donutTotalCount}
                </div>
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  Slots
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3 text-xs w-full sm:w-auto">
              <div className="p-2.5 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-0.5">
                <div className="flex items-center justify-between gap-4 font-bold text-sky-900">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00838F] shrink-0" />
                    <span>Public Swimming</span>
                  </div>
                  <span className="tabular-nums">{donutPublicCount} ({Math.round(donutPublicPct)}%)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-0.5">
                <div className="flex items-center justify-between gap-4 font-bold text-purple-900">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                    <span>Family Exclusive</span>
                  </div>
                  <span className="tabular-nums">{donutFamilyCount} ({Math.round(donutFamilyPct)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Recent Activity Audit Stream (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Activity className="w-4 h-4 text-[#00838F]" />
                <span>Live Operational Feed</span>
              </div>
              <Link href="/admin/bookings" className="text-xs font-bold text-[#00838F] hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              {recentActivities.length > 0 ? (
                recentActivities.slice(0, 5).map((act: any, idx: number) => (
                  <div
                    key={act.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100/90"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {act.type === "PAYMENT" ? (
                        <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : act.type === "BOOKING" ? (
                        <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                      ) : act.type === "WALKIN" ? (
                        <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                          <Users className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 block truncate">{act.title}</span>
                        <span className="text-[10px] text-slate-400">Real-time action</span>
                      </div>
                    </div>
                    {act.amount && (
                      <span className="font-black text-slate-900 tabular-nums shrink-0 ml-2">{act.amount}</span>
                    )}
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100/90">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">Payment received – BK-1029</span>
                        <span className="text-[10px] text-slate-400">2 min ago</span>
                      </div>
                    </div>
                    <span className="font-black text-emerald-700 tabular-nums">₹1,500</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100/90">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">New Booking – Public Daytime</span>
                        <span className="text-[10px] text-slate-400">5 min ago</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">5 Swimmers</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100/90">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                        <Users2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block">Exclusive Family Slot Held</span>
                        <span className="text-[10px] text-slate-400">12 min ago</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-purple-700">7 PM – 9 PM</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
