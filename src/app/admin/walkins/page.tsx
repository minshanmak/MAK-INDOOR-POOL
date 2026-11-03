"use client";

import React, { useState, useEffect } from "react";
import { formatPoolTime } from "@/lib/timezone";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Minus,
  Plus,
  ChevronDown,
} from "lucide-react";

export default function AdminWalkinsPage() {
  const [walkIns, setWalkIns] = useState<any[]>([]);
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [loading, setLoading] = useState(true);

  // Mode: "FULL" (Track entry, exit, duration) vs "QUICK" (Record visit & payment quickly)
  const [entryMode, setEntryMode] = useState<"FULL" | "QUICK">("FULL");

  // Form states
  const [visitorCount, setVisitorCount] = useState(4);
  const [ratePerHour] = useState(150);
  const [entryTime, setEntryTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CASH">("UPI");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Table filter: "ALL" | "ACTIVE" | "CHECKED_OUT"
  const [tableFilter, setTableFilter] = useState<"ALL" | "ACTIVE" | "CHECKED_OUT">("ALL");

  useEffect(() => {
    const now = new Date();
    setEntryTime(
      now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    );
  }, []);

  const fetchWalkIns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/walkins?status=all");
      const data = await res.json();
      setWalkIns(data.walkIns || []);
      setCurrentOccupancy(data.currentActiveVisitors || 0);
    } catch (err) {
      console.error("Error loading walk-ins", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalkIns();
  }, []);

  const calculatedCharge = visitorCount * 1 * ratePerHour;

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/walkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: entryMode === "QUICK" ? "QUICK_ENTRY" : "CHECK_IN",
          visitorCount,
          durationHours: 1,
          ratePerHour,
          collectedAmount: calculatedCharge,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log walk-in.");
      }

      setSuccessMsg(
        `✓ ${visitorCount} Swimmer${visitorCount > 1 ? "s" : ""} admitted successfully! Collected ₹${calculatedCharge.toFixed(2)} via ${paymentMethod}.`
      );
      fetchWalkIns();
    } catch (err: any) {
      setFormError(err.message || "Failed to record walk-in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (walkInId: string) => {
    try {
      const res = await fetch("/api/admin/walkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHECK_OUT",
          walkInId,
        }),
      });
      if (res.ok) {
        fetchWalkIns();
      }
    } catch (err) {
      console.error("Check-out error", err);
    }
  };

  const filteredWalkIns = walkIns.filter((w) => {
    if (tableFilter === "ACTIVE") return w.status === "ACTIVE";
    if (tableFilter === "CHECKED_OUT") return w.status === "CHECKED_OUT";
    return true;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top 2 Mode Selection Cards (Exact Match to Image 2 Card 3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode 1: Full Check-in / Check-out */}
        <button
          type="button"
          onClick={() => setEntryMode("FULL")}
          className={`relative p-5 rounded-3xl text-left transition-all border ${
            entryMode === "FULL"
              ? "bg-[#F0F6FF] border-[#2563EB] shadow-[0_8px_25px_rgba(37,99,235,0.12)] ring-1 ring-[#2563EB]"
              : "bg-white border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] hover:border-slate-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                entryMode === "FULL" ? "bg-[#1D68BD] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                Full Check-in / Check-out
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Track entry, exit and duration</p>
            </div>
            {entryMode === "FULL" && (
              <div className="w-6 h-6 rounded-full bg-[#1D68BD] text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>
        </button>

        {/* Mode 2: Quick Entry */}
        <button
          type="button"
          onClick={() => setEntryMode("QUICK")}
          className={`relative p-5 rounded-3xl text-left transition-all border ${
            entryMode === "QUICK"
              ? "bg-[#FAF5FF] border-[#9333EA] shadow-[0_8px_25px_rgba(147,51,234,0.12)] ring-1 ring-[#9333EA]"
              : "bg-white border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] hover:border-slate-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                entryMode === "QUICK" ? "bg-[#9333EA] text-white" : "bg-purple-50 text-[#9333EA]"
              }`}
            >
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Quick Entry</h3>
              <p className="text-xs text-slate-500 mt-0.5">Record visit and payment quickly</p>
            </div>
            {entryMode === "QUICK" && (
              <div className="w-6 h-6 rounded-full bg-[#9333EA] text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="font-semibold">{formError}</span>
        </div>
      )}

      {/* Main Two-Column Admission Form (Exact Match to Image 2 Card 3) */}
      <form onSubmit={handleEntrySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Visitor Details Card */}
        <div className="bg-white rounded-3xl p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4">
          <h2 className="font-extrabold text-slate-900 text-sm">Visitor Details</h2>

          {/* Stepper: No. of Visitors * */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              No. of Visitors <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5">
              <button
                type="button"
                onClick={() => setVisitorCount(Math.max(1, visitorCount - 1))}
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 font-bold flex items-center justify-center shadow-xs transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-black text-lg text-slate-900 tabular-nums">
                {visitorCount}
              </span>
              <button
                type="button"
                onClick={() => setVisitorCount(visitorCount + 1)}
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 font-bold flex items-center justify-center shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Entry Time * */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Entry Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right Column: Payment Details Card */}
        <div className="bg-white rounded-3xl p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="font-extrabold text-slate-900 text-sm">Payment Details</h2>

            {/* Amount (Auto) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Amount (Auto)</label>
              <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm font-extrabold text-slate-900 flex items-center justify-end">
                <span>₹{calculatedCharge.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method * */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as "UPI" | "CASH")}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition appearance-none"
                >
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Big Solid Blue Check In Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1D68BD] hover:bg-[#155299] active:scale-[0.99] text-white font-extrabold py-3.5 rounded-2xl shadow-md shadow-blue-700/20 transition-all text-sm mt-3"
          >
            {submitting ? "Checking In..." : "Check In"}
          </button>
        </div>
      </form>

      {/* Today's Walk-in Visitors & Live Checkout Ledger */}
      <div className="bg-white rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900">Today's Walk-in Visitors</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live capacity and counter checkout management
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTableFilter("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                tableFilter === "ALL"
                  ? "bg-[#1D68BD] text-white"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTableFilter("ACTIVE")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                tableFilter === "ACTIVE"
                  ? "bg-[#1D68BD] text-white"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              In Pool ({currentOccupancy})
            </button>
            <button
              type="button"
              onClick={() => setTableFilter("CHECKED_OUT")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                tableFilter === "CHECKED_OUT"
                  ? "bg-[#1D68BD] text-white"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              Checked Out
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading walk-in entries...</div>
          ) : filteredWalkIns.length > 0 ? (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Swimmers</th>
                  <th className="px-5 py-3.5">Entry Time</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWalkIns.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                          w.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {w.status === "ACTIVE" ? "In Pool" : "Checked Out"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {w.visitorCount} {w.visitorCount === 1 ? "Swimmer" : "Swimmers"}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {formatPoolTime(new Date(w.checkInTime), true)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{w.durationHours || 1} hr</td>
                    <td className="px-5 py-3.5 font-extrabold text-slate-900 tabular-nums">
                      ₹{w.collectedAmount}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          w.paymentMethod === "UPI"
                            ? "bg-purple-50 text-purple-700 border border-purple-200/80"
                            : "bg-blue-50 text-blue-700 border border-blue-200/80"
                        }`}
                      >
                        {w.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {w.status === "ACTIVE" ? (
                        <button
                          onClick={() => handleCheckOut(w.id)}
                          className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-xs transition"
                        >
                          Check Out
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No walk-in visitors found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
