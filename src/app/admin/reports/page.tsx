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
  ArrowRight,
  TrendingUp,
  Receipt,
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
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-mono">
        <div className="inline-flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <span>Generating operational audit report...</span>
        </div>
      </div>
    );
  }

  const { summary = {}, bookings = [], payments = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Title & Date Range Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-800 font-semibold mb-1">
            <span>AUDIT LEDGER & REVENUE INTELLIGENCE</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Financial & Operational Reports</h1>
          <p className="text-xs text-slate-500">
            Authoritative revenue breakdown, session distribution, and instant CSV export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">FROM:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">TO:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <button
            onClick={handleDownloadCsv}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Total Revenue Recorded</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            ₹{summary.totalRevenue || 0}
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between tabular-nums">
            <span>Cash: ₹{summary.cashRevenue || 0}</span>
            <span>UPI: ₹{summary.upiRevenue || 0}</span>
            <span>Gateway: ₹{summary.gatewayRevenue || 0}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Total Bookings In Range</span>
            <Calendar className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {summary.totalBookings || 0}
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
            <span>Family: {summary.familyBookings || 0}</span>
            <span>Public: {summary.publicBookings || 0}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Swimmer Volume</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {summary.totalGuestsSwam || 0}
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            Public admissions & private family guests
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-1.5">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold">
            <span>Completed Daily Closings</span>
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {summary.completedClosingsCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            End-of-day register sheets audited
          </div>
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-cyan-700" />
            <span>Recent Payment Ledger Entries ({payments.length})</span>
          </h2>
        </div>

        {payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Transaction Ref</th>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Gateway Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-800">
                      {p.transactionRef || p.id}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 tabular-nums">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{p.method}</td>
                    <td className="px-4 py-3 text-slate-600">{p.purpose || "SESSION_FEE"}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">₹{p.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : p.status === "FAILED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No transaction records found for the selected date range.
          </div>
        )}
      </div>
    </div>
  );
}
