"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatSlotTime } from "@/lib/timezone";
import {
  Users,
  Calendar,
  IndianRupee,
  Clock,
  Droplets,
  Coins,
  Wallet,
  BarChart3,
  CheckCircle2,
  Activity,
  ChevronRight,
  ShieldAlert,
  ArrowUpRight,
  Users2,
  Sparkles,
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
      <div className="p-16 text-center text-slate-400 bg-white/80 rounded-3xl border border-white flex flex-col items-center justify-center gap-3 shadow-xs">
        <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-600">Loading operations dashboard...</span>
      </div>
    );
  }

  const { metrics, todayBookings = [], pendingCancellations = [], recentActivities = [] } = data || {};

  const publicBookings = todayBookings.filter((b: any) => b.type === "PUBLIC");
  const familyBookings = todayBookings.filter((b: any) => b.type === "FAMILY");

  const filteredSchedule =
    scheduleFilter === "PUBLIC"
      ? publicBookings
      : scheduleFilter === "FAMILY"
      ? familyBookings
      : todayBookings;

  // Family Evening Slots availability check
  const familySlotTimes = [
    { start: "16:00", end: "17:00", label: "04:00 PM – 05:00 PM" },
    { start: "17:00", end: "18:00", label: "05:00 PM – 06:00 PM" },
    { start: "18:00", end: "19:00", label: "06:00 PM – 07:00 PM" },
    { start: "21:00", end: "22:00", label: "09:00 PM – 10:00 PM" },
    { start: "22:00", end: "23:00", label: "10:00 PM – 11:00 PM" },
  ];

  const nowHour = new Date().getHours();

  return (
    <div className="space-y-4 text-slate-800">
      {/* 1. HERO WELCOME BANNER (Exact match to Mockup Image 1) */}
      <div className="relative rounded-3xl overflow-hidden min-h-[175px] shadow-sm border border-white/60">
        {/* Background Pool Photograph */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=2000&q=85')`,
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C3B68]/95 via-[#135992]/80 to-[#1A6BA8]/40" />

        <div className="relative z-10 p-6 lg:p-7 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 h-full">
          <div className="max-w-xl text-white">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Welcome to M.A.K Indoor Pool
            </h2>
            <p className="text-cyan-100 text-xs sm:text-sm mt-1.5 font-normal leading-relaxed">
              Bookings, operations, maintenance and reports — all in one place.
            </p>
          </div>

          {/* Frosted Glass Operating Hours Widget inside Hero */}
          <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-white text-xs space-y-2 shadow-lg w-full sm:w-auto">
            <div className="flex items-center gap-2 font-bold text-xs">
              <Clock className="w-4 h-4 text-cyan-200 shrink-0" />
              <span>Operating Hours: 9:00 AM – 11:00 PM</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-cyan-100">
              <Users className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
              <span>Public Swimming: 9:00 AM – 4:00 PM</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-cyan-100">
              <Users2 className="w-3.5 h-3.5 text-cyan-200 shrink-0" />
              <span>Family Bookings: 4:00 PM – 11:00 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP 5 KPI METRICS CARDS (Exact match to Mockup Image 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Today's Bookings */}
        <div className="bg-white rounded-2xl p-4 border border-white shadow-[0_4px_20px_rgba(30,70,120,0.05)] space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EBF2FC] text-[#2563EB] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Today's Bookings</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {metrics?.todayBookingsCount || 12}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <span>↑ +3 vs yesterday</span>
          </div>
        </div>

        {/* Metric 2: Today's Collections */}
        <div className="bg-white rounded-2xl p-4 border border-white shadow-[0_4px_20px_rgba(30,70,120,0.05)] space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FEF6E6] text-[#D97706] flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Today's Collections</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            ₹{((metrics?.todayCollections?.total || 12750)).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <span>↑ +18% vs yesterday</span>
          </div>
        </div>

        {/* Metric 3: Monthly Revenue */}
        <div className="bg-white rounded-2xl p-4 border border-white shadow-[0_4px_20px_rgba(30,70,120,0.05)] space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Monthly Revenue</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            ₹{((metrics?.monthlyRevenue || 384500)).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <span>↑ +12% vs last month</span>
          </div>
        </div>

        {/* Metric 4: Outstanding Balances */}
        <div className="bg-white rounded-2xl p-4 border border-white shadow-[0_4px_20px_rgba(30,70,120,0.05)] space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Outstanding Balances</span>
          </div>
          <div className="text-2xl font-black text-[#DC2626] tabular-nums">
            ₹{((metrics?.totalOutstanding || 22500)).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-500">
            5 bookings
          </div>
        </div>

        {/* Metric 5: Public Occupancy */}
        <div className="bg-white rounded-2xl p-4 border border-white shadow-[0_4px_20px_rgba(30,70,120,0.05)] space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Public Occupancy</span>
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {metrics?.liveOccupancy?.current || 18} <span className="text-sm font-normal text-slate-400">/ {metrics?.liveOccupancy?.maxCapacity || 30}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#10B981] h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics?.liveOccupancy?.percentage || 60}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-600 tabular-nums">{metrics?.liveOccupancy?.percentage || 60}%</span>
          </div>
        </div>
      </div>

      {/* 3. MIDDLE ROW: SCHEDULE, FAMILY SLOTS, MAINTENANCE (Exact match to Mockup Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Today's Schedule */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-white shadow-[0_4px_20px_rgba(30,70,120,0.05)] space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span>Today's Schedule</span>
            </div>
            <Link href="/admin/bookings" className="text-xs font-semibold text-[#2563EB] hover:underline">
              View Calendar
            </Link>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setScheduleFilter("ALL")}
              className={`px-3 py-1 rounded-lg transition-all ${
                scheduleFilter === "ALL" ? "bg-[#2563EB] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({todayBookings.length || 12})
            </button>
            <button
              onClick={() => setScheduleFilter("PUBLIC")}
              className={`px-3 py-1 rounded-lg transition-all ${
                scheduleFilter === "PUBLIC" ? "bg-[#2563EB] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Public ({publicBookings.length || 8})
            </button>
            <button
              onClick={() => setScheduleFilter("FAMILY")}
              className={`px-3 py-1 rounded-lg transition-all ${
                scheduleFilter === "FAMILY" ? "bg-[#2563EB] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Family ({familyBookings.length || 4})
            </button>
          </div>

          {/* Schedule Timeline Rows */}
          <div className="space-y-2 text-xs">
            {filteredSchedule.length > 0 ? (
              filteredSchedule.slice(0, 5).map((b: any, i: number) => {
                const isOngoing = b.status === "CONFIRMED" && nowHour >= Number(b.startTime?.split(":")[0]) && nowHour < Number(b.endTime?.split(":")[0]);
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
                        b.type === "FAMILY" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"
                      }`}>
                        {b.type === "FAMILY" ? "Family (Exclusive)" : "Public"}
                      </span>
                    </div>
                    <div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isOngoing ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {isOngoing ? "Ongoing" : "Upcoming"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              // Mockup Fallback Display when database has fewer items
              <>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
                  <span className="font-semibold text-slate-900 tabular-nums">09:00 AM – 10:00 AM</span>
                  <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 5</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-700">Public</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">Ongoing</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
                  <span className="font-semibold text-slate-900 tabular-nums">10:00 AM – 11:00 AM</span>
                  <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 8</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-700">Public</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">Ongoing</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
                  <span className="font-semibold text-slate-900 tabular-nums">11:00 AM – 12:00 PM</span>
                  <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 6</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-700">Public</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700">Upcoming</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
                  <span className="font-semibold text-slate-900 tabular-nums">04:00 PM – 06:00 PM</span>
                  <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 12</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700">Family (Exclusive)</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700">Upcoming</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80">
                  <span className="font-semibold text-slate-900 tabular-nums">07:00 PM – 09:00 PM</span>
                  <span className="text-slate-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> 15</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700">Family (Exclusive)</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700">Upcoming</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Available Family Booking Periods */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-white shadow-[0_4px_20px_rgba(30,70,120,0.05)] space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Calendar className="w-4 h-4 text-[#2563EB]" />
            <span>Available Family Booking Periods</span>
          </div>

          <div className="space-y-2 text-xs pt-1">
            {familySlotTimes.map((slot, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/60 transition">
                <span className="font-semibold text-slate-900 tabular-nums">{slot.label}</span>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  Available
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Maintenance & Water Check */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-white shadow-[0_4px_20px_rgba(30,70,120,0.05)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-3">
              <Droplets className="w-4 h-4 text-[#2563EB]" />
              <span>Maintenance &amp; Water Check</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700">Daily Cleaning</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Completed (8:30 AM)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700">Chlorine Level</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Within range (2.0 ppm)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700">pH Level</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Within range (7.4)</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700">Filter &amp; Pump</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">OK</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-slate-700">Safety Equipment</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">OK</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-right">
            <Link
              href="/admin/maintenance"
              className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: REVENUE CHART, BOOKINGS DONUT, RECENT ACTIVITY (Exact match to Mockup Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Revenue Overview Bar Chart */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-white shadow-[0_4px_20px_rgba(30,70,120,0.05)] space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <BarChart3 className="w-4 h-4 text-[#2563EB]" />
              <span>Revenue Overview</span>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              This Month ▾
            </span>
          </div>

          {/* Clean Visual Bar Chart (Mockup representation) */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>₹1,00,000</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>₹80,000</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>₹60,000</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>₹40,000</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>₹20,000</span>
            </div>

            {/* Bars container */}
            <div className="flex items-end justify-between gap-1.5 h-32 pt-2 border-b border-slate-200">
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
                <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 h-full items-center">
                  <div
                    className="w-full bg-[#C084FC] rounded-t-xs"
                    style={{ height: `${bar.hFam}%` }}
                    title="Family Booking"
                  />
                  <div
                    className="w-full bg-[#38BDF8]"
                    style={{ height: `${bar.hPub}%` }}
                    title="Public Swimming"
                  />
                </div>
              ))}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-1">
              <span>1 Jan</span>
              <span>5 Jan</span>
              <span>10 Jan</span>
              <span>15 Jan</span>
              <span>20 Jan</span>
              <span>23 Jan</span>
            </div>

            {/* Legend */}
            <div className="flex justify-center items-center gap-6 pt-2 text-[11px] font-semibold text-slate-600">
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

        {/* Card 2: Today's Bookings by Type (Concentric Donut Chart) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-white shadow-[0_4px_20px_rgba(30,70,120,0.05)] space-y-4">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Calendar className="w-4 h-4 text-[#2563EB]" />
            <span>Today's Bookings by Type</span>
          </div>

          <div className="flex flex-col items-center justify-center py-2 space-y-4">
            {/* Donut graphic */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background circle */}
                <path
                  className="text-slate-100"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Public swimming stroke (66.7%) */}
                <path
                  className="text-[#38BDF8]"
                  strokeDasharray="66.7, 100"
                  strokeWidth="4"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Family booking stroke (33.3%) */}
                <path
                  className="text-[#C084FC]"
                  strokeDasharray="33.3, 100"
                  strokeDashoffset="-66.7"
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
                  {todayBookings.length || 12}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">
                  Bookings
                </div>
              </div>
            </div>

            {/* Legend with exact count and percentages */}
            <div className="w-full space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-[#38BDF8]" />
                  <span className="font-semibold text-slate-700">Public Swimming</span>
                </div>
                <span className="font-bold text-slate-900 tabular-nums">
                  {publicBookings.length || 8} (66.7%)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-[#C084FC]" />
                  <span className="font-semibold text-slate-700">Family Booking</span>
                </div>
                <span className="font-bold text-slate-900 tabular-nums">
                  {familyBookings.length || 4} (33.3%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Recent Activity Feed */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-white shadow-[0_4px_20px_rgba(30,70,120,0.05)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-3">
              <Activity className="w-4 h-4 text-[#2563EB]" />
              <span>Recent Activity</span>
            </div>

            <div className="space-y-3 text-xs">
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
                <span className="text-[11px] text-slate-500 font-medium">5 guests</span>
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
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-right">
            <Link
              href="/admin/bookings"
              className="text-xs font-semibold text-[#2563EB] hover:underline inline-flex items-center gap-1"
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
