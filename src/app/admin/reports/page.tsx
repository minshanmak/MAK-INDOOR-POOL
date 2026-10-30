"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  IndianRupee,
  Users,
  CreditCard,
  FileSpreadsheet,
} from "lucide-react";

export default function AdminReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handleDownloadCsv = () => {
    let url = "/api/admin/reports?format=csv";
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading reports & analytics...</div>;
  }

  const { summary = {}, bookings = [], payments = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Title & Date Range */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reports & Business Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational summaries, payment breakdowns, booking distributions, and CSV exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            placeholder="From"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
            placeholder="To"
          />
          <button
            onClick={handleDownloadCsv}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-semibold">Total Revenue Recorded</span>
          <div className="text-2xl font-black text-slate-900">₹{summary.totalRevenue || 0}</div>
          <div className="text-[11px] text-slate-500 pt-1 flex justify-between">
            <span>Cash: ₹{summary.cashRevenue || 0}</span>
            <span>UPI: ₹{summary.upiRevenue || 0}</span>
            <span>Online: ₹{summary.gatewayRevenue || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-semibold">Total Swimmers Attended</span>
          <div className="text-2xl font-black text-ocean-700">{summary.totalSwimmers || 0}</div>
          <span className="text-[11px] text-slate-400 block pt-1">Across bookings and walk-ins</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-semibold">Booking Mix (Sessions)</span>
          <div className="text-2xl font-black text-slate-900">
            {summary.familyBookingsCount + summary.publicBookingsCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 pt-1 flex justify-between">
            <span>Family: {summary.familyBookingsCount || 0}</span>
            <span>Public: {summary.publicBookingsCount || 0}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs text-slate-500 font-semibold">Outstanding Balances</span>
          <div className="text-2xl font-black text-amber-700">₹{summary.outstandingBalanceTotal || 0}</div>
          <span className="text-[11px] text-slate-400 block pt-1">To be collected at arrival</span>
        </div>
      </div>

      {/* Bookings Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 text-sm">Detailed Bookings Report ({bookings.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Booking ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Guests</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-mono font-bold text-ocean-700">{b.id}</td>
                  <td className="px-4 py-3">{b.bookingDate}</td>
                  <td className="px-4 py-3 font-semibold">{b.type}</td>
                  <td className="px-4 py-3">{b.customerName}</td>
                  <td className="px-4 py-3">{b.guestCount}</td>
                  <td className="px-4 py-3 font-bold">₹{b.totalAmount}</td>
                  <td className="px-4 py-3 text-emerald-700 font-bold">₹{b.totalPaid}</td>
                  <td className="px-4 py-3 text-amber-700 font-bold">₹{b.balanceAmount}</td>
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
      </div>
    </div>
  );
}

