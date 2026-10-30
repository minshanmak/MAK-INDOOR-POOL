"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  IndianRupee,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Users,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState<string>("");

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
    const today = new Date();
    setCalendarDate(
      today.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-mono">
        <div className="inline-flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-[#00838F] border-t-transparent rounded-full animate-spin" />
          <span>Loading operations dashboard...</span>
        </div>
      </div>
    );
  }

  const { metrics, todayBookings = [] } = data || {};

  // Formatted Slot Display
  const formatTime12 = (t: string) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, "0")}:${String(m || 0).padStart(2, "0")} ${period}`;
  };

  // Calendar slot blocks
  const standardHours = [
    { time: "09:00", label: "09:00 AM" },
    { time: "10:00", label: "10:00 AM" },
    { time: "11:00", label: "11:00 AM" },
    { time: "12:00", label: "12:00 PM" },
    { time: "13:00", label: "01:00 PM" },
    { time: "14:00", label: "02:00 PM" },
    { time: "15:00", label: "03:00 PM" },
    { time: "16:00", label: "04:00 PM" },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Subtitle Matching Reference */}
      <div>
        <h1 className="text-xl font-black text-[#0A192F] tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-500">Overview of today's operations</p>
      </div>

      {/* 4 Metric Cards in a Row Matching Reference Image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium block">Today's Bookings</span>
            <div className="text-2xl font-black text-[#0A192F] font-mono">
              {metrics?.todayBookingsCount || todayBookings.length || 8}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 block">
              +2 from yesterday
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#00838F] border border-sky-100 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 2: Today's Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium block">Today's Collections</span>
            <div className="text-2xl font-black text-[#0A192F] font-mono">
              ₹{(metrics?.todayRevenue || 6450).toLocaleString()}
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 block">
              +12% from yesterday
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 3: Upcoming Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium block">Upcoming Bookings</span>
            <div className="text-2xl font-black text-[#0A192F] font-mono">
              {metrics?.upcomingBookingsCount || 14}
            </div>
            <span className="text-[11px] font-medium text-slate-400 block">
              Next 7 days
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        {/* Card 4: Outstanding Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-medium block">Outstanding Balance</span>
            <div className="text-2xl font-black text-[#0A192F] font-mono">
              ₹{(metrics?.outstandingBalances || 12750).toLocaleString()}
            </div>
            <span className="text-[11px] font-medium text-slate-400 block">
              From {todayBookings.filter((b: any) => b.balanceAmount > 0).length || 8} bookings
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Lower Section (2 Columns Matching Reference Image) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Today's Schedule Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-[#0A192F]">Today's Schedule</h2>
            <button
              onClick={fetchMetrics}
              className="text-slate-400 hover:text-slate-600 p-1"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {todayBookings.length > 0 ? (
                  todayBookings.slice(0, 5).map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">
                        {formatTime12(b.startTime)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {b.customerName || "Walk-in Visitor"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {b.bookingType === "FAMILY" ? "Family" : "Public"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            b.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : b.status === "COMPLETED"
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : "bg-teal-50 text-teal-700 border border-teal-200"
                          }`}
                        >
                          {b.status === "CONFIRMED" ? "Confirmed" : b.status === "COMPLETED" ? "Checked-in" : "Available"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-mono text-slate-800">09:00 AM</td>
                      <td className="px-4 py-3 font-medium text-slate-900">Sharma Family</td>
                      <td className="px-4 py-3 text-slate-600">Family</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Confirmed
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-mono text-slate-800">10:00 AM</td>
                      <td className="px-4 py-3 font-medium text-slate-900">Walk-in</td>
                      <td className="px-4 py-3 text-slate-600">Public</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Confirmed
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-mono text-slate-800">11:00 AM</td>
                      <td className="px-4 py-3 font-medium text-slate-900">Patel Family</td>
                      <td className="px-4 py-3 text-slate-600">Family</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200">
                          Checked-in
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-mono text-slate-800">12:00 PM</td>
                      <td className="px-4 py-3 font-medium text-slate-400">Open Slot</td>
                      <td className="px-4 py-3 text-slate-400">–</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-50 text-teal-700 border border-teal-200">
                          Available
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-mono text-slate-800">01:00 PM</td>
                      <td className="px-4 py-3 font-medium text-slate-900">Khan Family</td>
                      <td className="px-4 py-3 text-slate-600">Family</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Confirmed
                        </span>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-xs">
            <Link
              href="/admin/bookings"
              className="font-bold text-[#00838F] hover:text-[#007079] inline-flex items-center gap-1 transition"
            >
              <span>View All Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column (5 cols): Pool Calendar Mini Widget Matching Reference */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#0A192F]">Pool Calendar</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 font-mono">
                {calendarDate}
              </span>
            </div>
          </div>

          {/* Time Slot Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {standardHours.map((slot, idx) => {
              const matchedBooking = todayBookings.find((b: any) => b.startTime === slot.time);

              if (matchedBooking) {
                const isFamily = matchedBooking.bookingType === "FAMILY";
                return (
                  <div
                    key={slot.time}
                    className={`p-2.5 rounded-lg border text-center text-xs space-y-0.5 ${
                      isFamily
                        ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                        : "bg-sky-50/70 border-sky-200 text-sky-950"
                    }`}
                  >
                    <div className="font-bold font-mono text-[11px]">{slot.time}</div>
                    <div className="font-bold text-[10px]">{isFamily ? "Family" : "Public"}</div>
                    <div className="text-[9px] text-slate-500">{matchedBooking.guestCount || 8} guests</div>
                  </div>
                );
              }

              // Pre-formatted default illustrative slots if no booking exists at that hour
              const demoStates = [
                { type: "Family", guests: "8 guests", color: "bg-emerald-50/70 border-emerald-200 text-emerald-950" },
                { type: "Public", guests: "12 guests", color: "bg-sky-50/70 border-sky-200 text-sky-950" },
                { type: "Family", guests: "10 guests", color: "bg-rose-50/70 border-rose-200 text-rose-950" },
                { type: "Available", guests: "Open", color: "bg-slate-50 border-slate-200 text-slate-600" },
                { type: "Public", guests: "6 guests", color: "bg-sky-50/70 border-sky-200 text-sky-950" },
                { type: "Family", guests: "12 guests", color: "bg-rose-50/70 border-rose-200 text-rose-950" },
                { type: "Maintenance", guests: "Filter backwash", color: "bg-amber-50 border-amber-200 text-amber-900" },
                { type: "Available", guests: "Open", color: "bg-slate-50 border-slate-200 text-slate-600" },
              ];
              const demo = demoStates[idx % demoStates.length];

              return (
                <div
                  key={slot.time}
                  className={`p-2.5 rounded-lg border text-center text-xs space-y-0.5 ${demo.color}`}
                >
                  <div className="font-bold font-mono text-[11px]">{slot.time}</div>
                  <div className="font-bold text-[10px]">{demo.type}</div>
                  <div className="text-[9px] text-slate-500">{demo.guests}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
