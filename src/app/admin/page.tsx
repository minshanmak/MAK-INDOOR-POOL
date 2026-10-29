"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  TrendingUp,
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
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading real-time pool metrics...
      </div>
    );
  }

  const { metrics, todayBookings, upcomingBookings, pendingCancellations } = data || {};

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Operations Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time authoritative pool statistics, live occupancy, and daily collections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/walkins"
            className="bg-ocean-600 hover:bg-ocean-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            + New Walk-in
          </Link>
          <Link
            href="/admin/bookings"
            className="bg-lagoon-600 hover:bg-lagoon-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5" />
            + New Staff Booking
          </Link>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Today's Collections</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{metrics?.todayCollections?.total || 0}
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
            <span>Cash: ₹{metrics?.todayCollections?.cash || 0}</span>
            <span>UPI: ₹{metrics?.todayCollections?.upi || 0}</span>
            <span>Online: ₹{metrics?.todayCollections?.gateway || 0}</span>
          </div>
        </div>

        {/* Live Pool Occupancy */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Live Pool Occupancy</span>
            <Users className="w-4 h-4 text-ocean-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
            <span>{metrics?.liveOccupancy?.current || 0}</span>
            <span className="text-xs font-normal text-slate-400">/ {metrics?.liveOccupancy?.maxCapacity || 25} max</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full ${
                (metrics?.liveOccupancy?.percentage || 0) > 80 ? "bg-amber-500" : "bg-ocean-600"
              }`}
              style={{ width: `${metrics?.liveOccupancy?.percentage || 0}%` }}
            />
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Outstanding Balances</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">
            ₹{metrics?.totalOutstanding || 0}
          </div>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Payable by customers at counter
          </div>
        </div>

        {/* Water Safety Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Water Quality Status</span>
            <Droplets className="w-4 h-4 text-lagoon-600" />
          </div>
          {metrics?.waterStatus ? (
            <div>
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                metrics.waterStatus.status === "OPTIMAL"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {metrics.waterStatus.status}
              </span>
              <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
                <span>Cl: {metrics.waterStatus.chlorinePpm} ppm</span>
                <span>pH: {metrics.waterStatus.phLevel}</span>
                <span>{metrics.waterStatus.clarity}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>No reading logged today!</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert Notices */}
      {pendingCancellations && pendingCancellations.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex justify-between items-center text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-ocean-600" />
            Today's Scheduled Bookings ({todayBookings?.length || 0})
          </h2>
          <Link href="/admin/bookings" className="text-xs font-semibold text-ocean-600 hover:underline">
            View All Bookings &rarr;
          </Link>
        </div>

        {todayBookings && todayBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todayBookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono font-bold text-ocean-700">{b.id}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.type === "FAMILY" ? "bg-purple-100 text-purple-800" : "bg-sky-100 text-sky-800"
                      }`}>
                        {b.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{b.startTime} – {b.endTime}</td>
                    <td className="px-4 py-3 font-medium">{b.customerName} ({b.customerPhone})</td>
                    <td className="px-4 py-3">{b.guestCount}</td>
                    <td className="px-4 py-3 font-bold">₹{b.totalAmount}</td>
                    <td className="px-4 py-3 text-emerald-700 font-semibold">₹{b.totalPaid}</td>
                    <td className="px-4 py-3 font-bold text-amber-700">₹{b.balanceAmount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
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
            No bookings scheduled for today yet.
          </div>
        )}
      </div>
    </div>
  );
}
