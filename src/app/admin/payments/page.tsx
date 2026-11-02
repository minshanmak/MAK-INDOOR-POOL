"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  IndianRupee,
  TrendingUp,
  CreditCard,
  RotateCcw,
  Search,
  Calendar,
  Filter,
  CheckCircle2,
} from "lucide-react";
import { formatPoolDate } from "@/lib/timezone";

export default function AdminPaymentsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tabs: "ALL" | "RECEIVED" | "PENDING" | "REFUNDS"
  const [activeTab, setActiveTab] = useState<"ALL" | "RECEIVED" | "PENDING" | "REFUNDS">("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [search, setSearch] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/payments");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const metrics = data?.metrics || {
    todayCollection: 12750,
    monthlyRevenue: 384500,
    outstanding: 22500,
    refundsMtd: 4500,
  };

  const filteredTransactions = useMemo(() => {
    const list = data?.transactions || [];
    return list.filter((t: any) => {
      // Tab filter
      if (activeTab === "RECEIVED" && t.status !== "Paid") return false;
      if (activeTab === "PENDING" && t.status !== "Pending") return false;
      if (activeTab === "REFUNDS" && t.status !== "Refunded") return false;

      // Method filter
      if (selectedMethod !== "ALL" && !t.method.toLowerCase().includes(selectedMethod.toLowerCase())) {
        return false;
      }

      // Date filter
      if (selectedDate && t.date !== selectedDate) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = t.id?.toLowerCase().includes(q);
        const matchCustomer = t.customer?.toLowerCase().includes(q);
        if (!matchId && !matchCustomer) return false;
      }

      return true;
    });
  }, [data, activeTab, selectedMethod, selectedDate, search]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header (Exact Mockup Match) */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Track and manage all payments
        </p>
      </div>

      {/* 4 Top KPI Cards (Exact Mockup Match) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Collection */}
        <div className="bg-[#F0FDF4] p-5 rounded-3xl border border-emerald-100 shadow-[0_4px_20px_rgba(20,60,110,0.04)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DCFCE7] text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0">
            ₹
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-600 block">Today's Collection</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{metrics.todayCollection.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Card 2: Monthly Revenue */}
        <div className="bg-[#EFF6FF] p-5 rounded-3xl border border-blue-100 shadow-[0_4px_20px_rgba(20,60,110,0.04)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DBEAFE] text-[#1D68BD] flex items-center justify-center font-bold text-lg shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-600 block">Monthly Revenue</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{metrics.monthlyRevenue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Card 3: Outstanding */}
        <div className="bg-[#FEF2F2] p-5 rounded-3xl border border-red-100 shadow-[0_4px_20px_rgba(20,60,110,0.04)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FEE2E2] text-rose-600 flex items-center justify-center font-bold text-lg shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-600 block">Outstanding</span>
            <span className="text-2xl font-black text-rose-600 tracking-tight">
              ₹{metrics.outstanding.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Card 4: Refunds (MTD) */}
        <div className="bg-[#FAF5FF] p-5 rounded-3xl border border-purple-100 shadow-[0_4px_20px_rgba(20,60,110,0.04)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] text-purple-600 flex items-center justify-center font-bold text-lg shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-600 block">Refunds (MTD)</span>
            <span className="text-2xl font-black text-purple-700 tracking-tight">
              ₹{metrics.refundsMtd.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs: All Payments, Received, Pending, Refunds */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "ALL"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
          }`}
        >
          All Payments
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("RECEIVED")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "RECEIVED"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
          }`}
        >
          Received
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("PENDING")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "PENDING"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
          }`}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("REFUNDS")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "REFUNDS"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
          }`}
        >
          Refunds
        </button>
      </div>

      {/* Filter Bar (Date, Method, Search) */}
      <div className="bg-white p-3.5 rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Methods Dropdown */}
          <select
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
          >
            <option value="ALL">All Methods</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 w-full md:max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking ID or customer..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition-all font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Transactions Table (Exact Mockup Match) */}
      <div className="bg-white rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading transactions ledger...</div>
        ) : filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Transaction</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t: any, idx: number) => {
                  const isUPI = t.method?.toLowerCase().includes("upi");
                  const isCash = t.method?.toLowerCase().includes("cash");
                  return (
                    <tr key={t.id + idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* Transaction ID */}
                      <td className="px-5 py-3.5 font-mono font-extrabold text-[#1D68BD]">
                        {t.id}
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        <div>{t.customer}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-medium">{t.phone}</div>
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-3.5 font-black text-slate-900 tabular-nums">
                        ₹{t.amount?.toLocaleString("en-IN")}
                      </td>

                      {/* Method Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                            isUPI
                              ? "bg-purple-50 text-purple-700 border border-purple-200/80"
                              : isCash
                              ? "bg-blue-50 text-blue-700 border border-blue-200/80"
                              : "bg-sky-50 text-sky-700 border border-sky-200/80"
                          }`}
                        >
                          {t.method}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                            t.status === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : t.status === "Refunded"
                              ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                              : "bg-amber-50 text-amber-700 border border-amber-200/80"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">No transactions found.</div>
        )}
      </div>
    </div>
  );
}
