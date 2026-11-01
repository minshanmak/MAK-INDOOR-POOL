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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time live pool occupancy, financial collections, and booking operations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/walkins"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3 py-2 rounded-lg text-xs transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            + Walk-in Swimmer
          </Link>
          <Link
            href="/admin/bookings"
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-2 rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            + Staff Booking
          </Link>
        </div>
      </div>

      {/* KPI Tiles Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Collections */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Today's Collections</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            ₹{metrics?.todayCollections?.total || 0}
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
            <span>Cash: ₹{metrics?.todayCollections?.cash || 0}</span>
            <span>UPI: ₹{metrics?.todayCollections?.upi || 0}</span>
            <span>Online: ₹{metrics?.todayCollections?.gateway || 0}</span>
          </div>
        </div>

        {/* Metric 2: Live Pool Occupancy */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Live Pool Occupancy</span>
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1 tabular-nums">
            <span>{metrics?.liveOccupancy?.current || 0}</span>
            <span className="text-xs font-normal text-slate-400">/ {metrics?.liveOccupancy?.maxCapacity || 25} Max</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full ${
                (metrics?.liveOccupancy?.percentage || 0) > 80 ? "bg-amber-500" : "bg-cyan-600"
              }`}
              style={{ width: `${metrics?.liveOccupancy?.percentage || 0}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Outstanding Balances */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Pending Counter Balances</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 tabular-nums">
            ₹{metrics?.totalOutstanding || 0}
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Collect upon customer check-in
          </div>
        </div>

        {/* Metric 4: Water Quality */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Water Quality Status</span>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          {metrics?.waterStatus ? (
            <div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                metrics.waterStatus.status === "OPTIMAL"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {metrics.waterStatus.status}
              </span>
              <div className="text-[11px] text-slate-500 mt-2 flex justify-between tabular-nums">
                <span>Cl: {metrics.waterStatus.chlorinePpm} ppm</span>
                <span>pH: {metrics.waterStatus.phLevel}</span>
                <span>{metrics.waterStatus.clarity}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-700 flex items-center gap-1.5 pt-1">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>No reading logged today</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert Notices */}
      {pendingCancellations && pendingCancellations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 flex justify-between items-center text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{pendingCancellations.length} Pending Cancellation Request(s):</strong> Review and approve to release locked slots.
            </span>
          </div>
          <Link
            href="/admin/cancellations"
            className="font-bold underline text-amber-950 hover:text-amber-800"
          >
            Review Requests &rarr;
          </Link>
        </div>
      )}

      {/* Today's Schedule Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-700" />
            Today's Pool Schedule ({todayBookings.length} sessions)
          </h2>
          <Link href="/admin/bookings" className="text-xs font-semibold text-cyan-700 hover:underline">
            View All Bookings &rarr;
          </Link>
        </div>

        {todayBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Session Type</th>
                  <th className="px-4 py-3">Scheduled Time</th>
                  <th className="px-4 py-3">Customer Contact</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-800">{b.id}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.type === "FAMILY"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-sky-50 text-sky-700 border border-sky-200"
                      }`}>
                        {b.type === "FAMILY" ? "Family (Private)" : "Public"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 tabular-nums">
                      {formatSlotTime(b.startTime)} – {formatSlotTime(b.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{b.customerName}</div>
                      <div className="text-[10px] text-slate-500">{b.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">{b.guestCount} Persons</td>
                    <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">₹{b.totalAmount}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700 tabular-nums">₹{b.totalPaid}</td>
                    <td className="px-4 py-3 font-bold text-amber-700 tabular-nums">₹{b.balanceAmount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
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
