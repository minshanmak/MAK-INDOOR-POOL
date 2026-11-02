"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatSlotTime } from "@/lib/timezone";
import {
  Users,
  Calendar,
  IndianRupee,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  ShieldAlert,
  ArrowRight,
  Plus,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="p-8 text-center text-slate-400 text-xs">
        Loading real-time pool metrics...
      </div>
    );
  }

  const { metrics, todayBookings = [], pendingCancellations = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Operations Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Real-time live pool occupancy, financial collections, and booking operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/walkins"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-full text-xs transition shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            + Walk-in Swimmer
          </Link>
          <Link
            href="/admin/bookings"
            className="bg-[#007AFF] hover:bg-[#0066DD] text-white font-semibold px-4 py-2 rounded-full text-xs transition shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            + Staff Booking
          </Link>
        </div>
      </div>

      {/* iOS Activity & Health Widget KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Collections */}
        <div className="bg-white p-5 rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500">Today's Collections</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tabular-nums tracking-tight">
            ₹{metrics?.todayCollections?.total || 0}
          </div>
          <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 flex justify-between text-[11px] text-slate-600 tabular-nums">
            <span>Cash: <strong className="text-slate-900">₹{metrics?.todayCollections?.cash || 0}</strong></span>
            <span>UPI: <strong className="text-slate-900">₹{metrics?.todayCollections?.upi || 0}</strong></span>
            <span>Web: <strong className="text-slate-900">₹{metrics?.todayCollections?.gateway || 0}</strong></span>
          </div>
        </div>

        {/* Metric 2: Live Pool Occupancy */}
        <div className="bg-white p-5 rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500">Live Pool Occupancy</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1.5 tabular-nums tracking-tight">
            <span>{metrics?.liveOccupancy?.current || 0}</span>
            <span className="text-xs font-medium text-slate-400">/ {metrics?.liveOccupancy?.maxCapacity || 25} Max</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (metrics?.liveOccupancy?.percentage || 0) > 80 ? "bg-amber-500" : "bg-gradient-to-r from-cyan-500 to-blue-600"
              }`}
              style={{ width: `${metrics?.liveOccupancy?.percentage || 0}%` }}
            />
          </div>
          <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 flex justify-between text-[11px] text-slate-600 tabular-nums">
            <span>Online: <strong className="text-slate-900">{metrics?.liveOccupancy?.onlineBookingsGuests || 0}</strong></span>
            <span>Walk-in: <strong className="text-slate-900">{metrics?.liveOccupancy?.walkInGuests || 0}</strong></span>
            <span className="font-bold text-emerald-600">
              {Math.max(0, (metrics?.liveOccupancy?.maxCapacity || 25) - (metrics?.liveOccupancy?.current || 0))} open
            </span>
          </div>
        </div>

        {/* Metric 3: Outstanding Balances */}
        <div className="bg-white p-5 rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500">Pending Balances</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 tabular-nums tracking-tight">
            ₹{metrics?.totalOutstanding || 0}
          </div>
          <div className="bg-amber-50/60 rounded-2xl p-2.5 border border-amber-100 text-[11px] text-amber-800 font-medium">
            Collect at counter upon swimmer check-in
          </div>
        </div>

        {/* Metric 4: Water Quality */}
        <div className="bg-white p-5 rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-500">Water Quality</span>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          {metrics?.waterStatus ? (
            <div className="space-y-2.5">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                metrics.waterStatus.status === "OPTIMAL"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {metrics.waterStatus.status}
              </span>
              <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100 flex justify-between text-[11px] text-slate-600 tabular-nums">
                <span>Cl: <strong className="text-slate-900">{metrics.waterStatus.chlorinePpm} ppm</strong></span>
                <span>pH: <strong className="text-slate-900">{metrics.waterStatus.phLevel}</strong></span>
                <span className="capitalize">{metrics.waterStatus.clarity}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-700 flex items-center gap-1.5 pt-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>No reading logged today</span>
            </div>
          )}
        </div>
      </div>

      {/* iOS Notification Banner for Pending Cancellations */}
      {pendingCancellations && pendingCancellations.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-xs rounded-2xl p-4 flex justify-between items-center text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{pendingCancellations.length} Pending Cancellation Request(s):</strong> Review and approve to release locked slots.
            </span>
          </div>
          <Link
            href="/admin/cancellations"
            className="font-bold text-[#007AFF] hover:underline flex items-center gap-1"
          >
            Review Requests &rarr;
          </Link>
        </div>
      )}

      {/* Today's Schedule Card (Apple Inset Grouped Table) */}
      <div className="bg-white rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            Today's Pool Schedule ({todayBookings.length} sessions)
          </h2>
          <Link href="/admin/bookings" className="text-xs font-semibold text-[#007AFF] hover:underline">
            View All Bookings &rarr;
          </Link>
        </div>

        {todayBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Booking ID</th>
                  <th className="px-5 py-3">Session Type</th>
                  <th className="px-5 py-3">Scheduled Time</th>
                  <th className="px-5 py-3">Customer Contact</th>
                  <th className="px-5 py-3">Guests</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Paid Amount</th>
                  <th className="px-5 py-3">Balance</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {todayBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-cyan-800">{b.id}</td>
                    <td className="px-5 py-3.5 font-semibold">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.type === "FAMILY"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                          : "bg-sky-50 text-sky-700 border border-sky-200/80"
                      }`}>
                        {b.type === "FAMILY" ? "Family (Private)" : "Public"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800 tabular-nums">
                      {formatSlotTime(b.startTime)} – {formatSlotTime(b.endTime)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{b.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{b.customerPhone}</div>
                    </td>
                    <td className="px-5 py-3.5">{b.guestCount} Persons</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 tabular-nums">₹{b.totalAmount}</td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-700 tabular-nums">₹{b.totalPaid}</td>
                    <td className="px-5 py-3.5 font-bold text-amber-700 tabular-nums">₹{b.balanceAmount}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                          : "bg-rose-50 text-rose-700 border border-rose-200/80"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No bookings scheduled for today. Use the buttons above to log walk-ins or create bookings.
          </div>
        )}
      </div>
    </div>
  );
}
