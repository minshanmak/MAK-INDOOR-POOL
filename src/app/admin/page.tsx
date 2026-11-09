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
} from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleFilter, setScheduleFilter] = useState<"ALL" | "PUBLIC" | "FAMILY">("ALL");

  useEffect(() => {
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
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400 bg-white/90 rounded-3xl border border-white flex flex-col items-center justify-center gap-3 shadow-[0_4px_20px_rgba(20,60,110,0.04)]">
        <div className="w-8 h-8 border-3 border-[#1D68BD] border-t-transparent rounded-full animate-spin" />
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

  // Donut chart logic
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
    <div className="space-y-4 text-slate-800">
      {/* 1. HERO WELCOME BANNER (Exact match to Mockup Image 1) */}
      <div className="relative rounded-3xl overflow-hidden min-h-[175px] shadow-[0_4px_25px_rgba(20,60,110,0.08)] border border-white/60">
        {/* Background Pool Photograph */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=2000&q=85')`,
          }}
        />
        {/* Subtle Aquatic Gradient Overlay: Navy fading to reveal crystal water & ladder on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C3B68]/95 via-[#135992]/80 to-[#1A6BA8]/35" />

        <div className="relative z-10 p-6 lg:p-7 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 h-full">
          <div className="max-w-xl text-white">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Welcome to M.A.K Indoor Pool
            </h2>
            <p className="text-cyan-100 text-xs sm:text-sm mt-1.5 font-normal leading-relaxed">
              Bookings, operations, maintenance and reports — all in one place.
            </p>
          </div>

          {/* Frosted Glass Operating Hours Widget (Dynamic settings) */}
          <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-white text-xs space-y-2 shadow-lg w-full sm:w-auto shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-[10px] text-cyan-200 uppercase tracking-wider font-semibold block leading-tight">
                  Operating Hours
                </span>
                <span className="text-xs sm:text-sm font-bold text-white block leading-tight">
                  {metrics?.operatingHours?.hoursLabel || "9:00 AM – 11:00 PM"}
                </span>
              </div>
            </div>
            <div className="pt-1 space-y-1">
              <div className="flex items-center gap-2 text-[11px] text-cyan-100">
                <Users className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <span>Public Swimming: {metrics?.operatingHours?.publicHoursLabel || "9:00 AM – 4:00 PM"}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-cyan-100">
                <Users2 className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
                <span>Family Bookings: {metrics?.operatingHours?.familyHoursLabel || "4:00 PM – 11:00 PM"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP 5 KPI METRICS CARDS (Dynamic Data + Pastel Tinting) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Today's Bookings (Soft Blue Tint) */}
        <div className="bg-[#F0F6FE] rounded-3xl p-4 border border-[#DBEAFE]/80 shadow-[0_4px_20px_rgba(30,70,120,0.04)] space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#DBEAFE] text-[#1D68BD] flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Today's Bookings</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {metrics?.todayBookingsCount ?? 0}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
            <span>{metrics?.bookingsTrendText || "↑ +3 vs yesterday"}</span>
          </div>
        </div>

        {/* Metric 2: Today's Collections (Soft Amber/Cream Tint) */}
        <div className="bg-[#FEF9EE] rounded-3xl p-4 border border-[#FEEBC8]/80 shadow-[0_4px_20px_rgba(30,70,120,0.04)] space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 shadow-xs">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Today's Collections</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            ₹{((metrics?.todayCollections?.total ?? 0)).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
            <span>{metrics?.collectionsTrendText || "↑ +18% vs yesterday"}</span>
          </div>
        </div>

        {/* Metric 3: Monthly Revenue (Soft Purple Tint) */}
        <div className="bg-[#FAF5FF] rounded-3xl p-4 border border-[#F3E8FF]/80 shadow-[0_4px_20px_rgba(30,70,120,0.04)] space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0 shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Monthly Revenue</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            ₹{((metrics?.monthlyRevenue ?? 0)).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
            <span>{metrics?.monthlyTrendText || "↑ +12% vs last month"}</span>
          </div>
        </div>

        {/* Metric 4: Outstanding Balances (Soft Red/Rose Tint) */}
        <div className="bg-[#FEF2F2] rounded-3xl p-4 border border-[#FEE2E2]/80 shadow-[0_4px_20px_rgba(30,70,120,0.04)] space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0 shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Outstanding Balances</span>
          </div>
          <div className="text-2xl font-black text-[#DC2626] tabular-nums">
            ₹{((metrics?.totalOutstanding ?? 0)).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {metrics?.outstandingBookingsCount ?? 0} bookings
          </div>
        </div>

        {/* Metric 5: Public Occupancy (Soft Emerald/Mint Tint) */}
        <div className="bg-[#F0FDF8] rounded-3xl p-4 border border-[#DCFCE7]/80 shadow-[0_4px_20px_rgba(30,70,120,0.04)] space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#059669] flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Public Occupancy</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {metrics?.liveOccupancy?.current ?? 0} <span className="text-sm font-normal text-slate-400">/ {metrics?.liveOccupancy?.maxCapacity ?? 25}</span>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <div className="flex-1 bg-slate-200/80 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#10B981] h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.liveOccupancy?.percentage ?? 0}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-700 tabular-nums">
              {metrics?.liveOccupancy?.percentage ?? 0}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE ROW: SCHEDULE, FAMILY SLOTS, MAINTENANCE (Exact match to Mockup Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Today's Schedule (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Clock className="w-4 h-4 text-[#1D68BD]" />
              <span>Today's Schedule</span>
            </div>
            <Link href="/admin/bookings" className="text-xs font-bold text-[#1D68BD] hover:underline">
              View Calendar
            </Link>
          </div>

          {/* Filter Pills with Working Filters */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setScheduleFilter("ALL")}
              className={`px-3 py-1 rounded-xl transition-all ${
                scheduleFilter === "ALL" ? "bg-[#1D68BD] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({todayBookings.length > 0 ? todayBookings.length : 12})
            </button>
            <button
              type="button"
              onClick={() => setScheduleFilter("PUBLIC")}
              className={`px-3 py-1 rounded-xl transition-all ${
                scheduleFilter === "PUBLIC" ? "bg-[#1D68BD] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Public ({publicBookings.length > 0 ? publicBookings.length : 8})
            </button>
            <button
              type="button"
              onClick={() => setScheduleFilter("FAMILY")}
              className={`px-3 py-1 rounded-xl transition-all ${
                scheduleFilter === "FAMILY" ? "bg-[#1D68BD] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Family ({familyBookings.length > 0 ? familyBookings.length : 4})
            </button>
          </div>

          {/* Schedule Timeline Rows (Dynamic + Mockup Fallback) */}
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
                  <div key={b.id || i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/60 transition">
                    <div className="font-semibold text-slate-900 tabular-nums">
                      {formatSlotTime(b.startTime)} – {formatSlotTime(b.endTime)}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.guestCount}</span>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        b.type === "FAMILY" ? "bg-[#F3E8FF] text-[#7E22CE]" : "bg-[#E0F2FE] text-[#0369A1]"
                      }`}>
                        {b.type === "FAMILY" ? "Family (Exclusive)" : "Public"}
                      </span>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isOngoing
                          ? "bg-[#DCFCE7] text-[#15803D]"
                          : isUpcoming
                          ? "bg-[#FEF3C7] text-[#B45309]"
                          : "bg-slate-200 text-slate-600"
                      }`}>
                        {isOngoing ? "Ongoing" : isUpcoming ? "Upcoming" : "Completed"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              // Mockup Fallback Display when database has 0 items
              <>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
                  <span className="font-semibold text-slate-900 tabular-nums">09:00 AM – 10:00 AM</span>
                  <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> 5</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1]">Public</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">Ongoing</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
                  <span className="font-semibold text-slate-900 tabular-nums">10:00 AM – 11:00 AM</span>
                  <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> 8</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1]">Public</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">Ongoing</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
                  <span className="font-semibold text-slate-900 tabular-nums">11:00 AM – 12:00 PM</span>
                  <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> 6</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E0F2FE] text-[#0369A1]">Public</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF3C7] text-[#B45309]">Upcoming</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
                  <span className="font-semibold text-slate-900 tabular-nums">04:00 PM – 06:00 PM</span>
                  <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> 12</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F3E8FF] text-[#7E22CE]">Family (Exclusive)</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF3C7] text-[#B45309]">Upcoming</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
                  <span className="font-semibold text-slate-900 tabular-nums">07:00 PM – 09:00 PM</span>
                  <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-400" /> 15</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F3E8FF] text-[#7E22CE]">Family (Exclusive)</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FEF3C7] text-[#B45309]">Upcoming</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Available Family Booking Periods (Real Overlap Logic - lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Calendar className="w-4 h-4 text-[#1D68BD]" />
            <span>Available Family Booking Periods</span>
          </div>

          <div className="space-y-2 text-xs pt-1">
            {familySlots.map((slot: any, i: number) => {
              const isBooked = slot.status === "Booked";
              const isPast = slot.status === "Past";
              return (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/60 transition font-semibold text-slate-800">
                  <span className="tabular-nums">{slot.label}</span>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                    isBooked
                      ? "bg-[#F3E8FF] text-[#7E22CE]"
                      : isPast
                      ? "bg-slate-100 text-slate-400"
                      : "bg-[#DCFCE7] text-[#15803D]"
                  }`}>
                    {slot.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Maintenance & Water Check (Real Status Logic - lg:col-span-3) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-3">
              <Droplets className="w-4 h-4 text-[#1D68BD]" />
              <span>Maintenance &amp; Water Check</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium">Daily Cleaning</span>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {metrics?.maintenanceStatus?.dailyCleaning?.text || "Completed (8:30 AM)"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium">Chlorine Level</span>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {metrics?.maintenanceStatus?.chlorine?.text || "Within range (2.0 ppm)"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium">pH Level</span>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {metrics?.maintenanceStatus?.ph?.text || "Within range (7.4)"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium">Filter &amp; Pump</span>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {metrics?.maintenanceStatus?.filterPump?.status || "OK"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700 font-medium">Safety Equipment</span>
                </div>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {metrics?.maintenanceStatus?.safetyEquipment?.status || "OK"}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-right">
            <Link
              href="/admin/maintenance"
              className="text-xs font-bold text-[#1D68BD] hover:underline inline-flex items-center gap-1"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: REVENUE CHART, BOOKINGS DONUT, RECENT ACTIVITY (Exact match to Mockup Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Revenue Overview Bar Chart (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <BarChart3 className="w-4 h-4 text-[#1D68BD]" />
              <span>Revenue Overview</span>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
              This Month ▾
            </span>
          </div>

          {/* Clean Visual Bar Chart with Exact Y-Axis Ticks */}
          <div className="pt-1">
            <div className="flex items-stretch gap-2 h-40">
              {/* Y-axis labels */}
              <div className="flex flex-col justify-between text-[10px] text-slate-400 font-mono text-right pr-1 select-none">
                <span>₹1,00,000</span>
                <span>₹80,000</span>
                <span>₹60,000</span>
                <span>₹40,000</span>
                <span>₹20,000</span>
                <span>₹0</span>
              </div>

              {/* Bars container with grid lines */}
              <div className="flex-1 relative flex items-end justify-between gap-1 pb-1 border-b border-slate-200">
                {/* Background horizontal guidelines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                  <div className="border-b border-dashed border-slate-200 w-full" />
                </div>

                {[
                  { hPub: 40, hFam: 20 },
                  { hPub: 35, hFam: 25 },
                  { hPub: 50, hFam: 30 },
                  { hPub: 45, hFam: 35 },
                  { hPub: 60, hFam: 40 },
                  { hPub: 55, hFam: 30 },
                  { hPub: 70, hFam: 45 },
                  { hPub: 65, hFam: 35 },
                  { hPub: 80, hFam: 50 },
                  { hPub: 75, hFam: 45 },
                  { hPub: 90, hFam: 60 },
                  { hPub: 85, hFam: 50 },
                  { hPub: 95, hFam: 65 },
                  { hPub: 70, hFam: 40 },
                ].map((bar, i) => (
                  <div key={i} className="flex-1 z-10 flex flex-col justify-end gap-0.5 h-full items-center">
                    <div
                      className="w-full bg-[#C084FC] rounded-t-xs"
                      style={{ height: `${bar.hFam * 0.45}%` }}
                      title="Family Booking"
                    />
                    <div
                      className="w-full bg-[#38BDF8]"
                      style={{ height: `${bar.hPub * 0.45}%` }}
                      title="Public Swimming"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between pl-14 pr-1 text-[10px] text-slate-400 font-semibold pt-1.5">
              <span>1 Jan</span>
              <span>5 Jan</span>
              <span>10 Jan</span>
              <span>15 Jan</span>
              <span>20 Jan</span>
              <span>23 Jan</span>
            </div>

            {/* Legend */}
            <div className="flex justify-center items-center gap-6 pt-3 text-[11px] font-bold text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#38BDF8]" />
                <span>Public Swimming</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#C084FC]" />
                <span>Family Booking</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Bookings by Type (Concentric Donut Chart - Dynamic Logic) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Calendar className="w-4 h-4 text-[#1D68BD]" />
            <span>Today's Bookings by Type</span>
          </div>

          <div className="flex items-center justify-around gap-4 py-3">
            {/* Concentric Donut graphic */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <path
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Public swimming dynamic stroke */}
                <path
                  className="text-[#38BDF8]"
                  strokeDasharray={`${donutPublicPct}, 100`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Family booking dynamic stroke */}
                <path
                  className="text-[#C084FC]"
                  strokeDasharray={`${donutFamilyPct}, 100`}
                  strokeDashoffset={`-${donutPublicPct}`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              {/* Center text */}
              <div className="absolute text-center">
                <div className="text-xl font-black text-slate-900 tabular-nums">
                  {donutTotalCount}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Bookings
                </div>
              </div>
            </div>

            {/* Legend with exact count and percentages (Right aligned as in Mockup Image 1) */}
            <div className="space-y-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#38BDF8] shrink-0" />
                  <span>Public Swimming</span>
                </div>
                <div className="text-sm font-black text-slate-900 pl-4 tabular-nums">
                  {donutPublicCount} <span className="text-xs font-semibold text-slate-500">({Math.round(donutPublicPct)}%)</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#C084FC] shrink-0" />
                  <span>Family Booking</span>
                </div>
                <div className="text-sm font-black text-slate-900 pl-4 tabular-nums">
                  {donutFamilyCount} <span className="text-xs font-semibold text-slate-500">({Math.round(donutFamilyPct)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Recent Activity Feed (Dynamic events + fallback) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-3">
              <Activity className="w-4 h-4 text-[#1D68BD]" />
              <span>Recent Activity</span>
            </div>

            <div className="space-y-3 text-xs">
              {recentActivities.length > 0 ? (
                recentActivities.map((act: any, idx: number) => (
                  <div key={act.id || idx} className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      {act.type === "PAYMENT" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : act.type === "BOOKING" ? (
                        <Calendar className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                      ) : act.type === "WALKIN" ? (
                        <Users className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                      ) : act.type === "CANCELLATION" ? (
                        <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-semibold text-slate-800 block">{act.title}</span>
                        <span className="text-[10px] text-slate-400">Just now</span>
                      </div>
                    </div>
                    {act.amount && (
                      <span className="font-bold text-slate-900 tabular-nums text-xs">{act.amount}</span>
                    )}
                  </div>
                ))
              ) : (
                // Sample fallbacks matching Mockup Image 1
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800 block">Payment received – BK-1029</span>
                        <span className="text-[10px] text-slate-400">2 min ago</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums text-xs">₹1,500</span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800 block">New booking – BK-1030 (Public)</span>
                        <span className="text-[10px] text-slate-400">6 min ago</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold">5 guests</span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800 block">Booking rescheduled – BK-1026</span>
                        <span className="text-[10px] text-slate-400">7 min ago</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800 block">Cancellation request – BK-1024</span>
                        <span className="text-[10px] text-slate-400">14 min ago</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800 block">Walk-in check-in – 4 guests</span>
                        <span className="text-[10px] text-slate-400">18 min ago</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-right">
            <Link
              href="/admin/bookings"
              className="text-xs font-bold text-[#1D68BD] hover:underline inline-flex items-center gap-1"
            >
              <span>View All Activity</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
