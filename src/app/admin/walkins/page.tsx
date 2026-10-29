"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  IndianRupee,
  LogOut,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export default function AdminWalkinsPage() {
  const [walkIns, setWalkIns] = useState<any[]>([]);
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form Mode: "QUICK" or "CHECK_IN"
  const [entryMode, setEntryMode] = useState<"QUICK" | "CHECK_IN">("QUICK");
  const [visitorCount, setVisitorCount] = useState(1);
  const [durationHours, setDurationHours] = useState(1);
  const [ratePerHour, setRatePerHour] = useState(150);
  const [overrideCharge, setOverrideCharge] = useState<string>("");
  const [overrideReason, setOverrideReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI">("CASH");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const calculatedCharge = visitorCount * durationHours * ratePerHour;
  const isOverridden = overrideCharge !== "" && Number(overrideCharge) !== calculatedCharge;

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isOverridden && !overrideReason.trim()) {
      setFormError("A mandatory explanation reason is required for fee overrides.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/walkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: entryMode === "QUICK" ? "QUICK_ENTRY" : "CHECK_IN",
          visitorCount,
          durationHours,
          ratePerHour,
          overrideCharge: isOverridden ? Number(overrideCharge) : null,
          overrideReason: isOverridden ? overrideReason : null,
          collectedAmount: isOverridden ? Number(overrideCharge) : calculatedCharge,
          paymentMethod,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log walk-in.");
      }

      setVisitorCount(1);
      setDurationHours(1);
      setOverrideCharge("");
      setOverrideReason("");
      setCustomerName("");
      setCustomerPhone("");
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

  const maxCapacity = 25;
  const isNearCapacity = currentOccupancy >= maxCapacity * 0.8;

  return (
    <div className="space-y-6">
      {/* Header & Live Capacity Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-800 font-semibold mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>DAYTIME PUBLIC SWIMMING DESK (09:00 – 16:00)</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Walk-in Counter & Live Occupancy</h1>
          <p className="text-xs text-slate-500">
            Public swimmer admission, check-in/out tracking, live capacity control, and fee overrides
          </p>
        </div>

        <div
          className={`px-3.5 py-2 rounded-xl border flex items-center gap-3 ${
            isNearCapacity
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-white border-slate-200/90 shadow-xs"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              isNearCapacity ? "bg-amber-500 text-white" : "bg-cyan-50 text-cyan-700"
            }`}
          >
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Current Swimmers on Deck
            </span>
            <span className="text-lg font-black text-slate-900 tabular-nums">
              {currentOccupancy}{" "}
              <span className="text-xs font-normal text-slate-400">/ {maxCapacity} Max Capacity</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Walk-in Form Pane */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-cyan-700" />
              <span>Admit New Swimmer</span>
            </h2>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setEntryMode("QUICK")}
                className={`px-2 py-1 rounded transition ${
                  entryMode === "QUICK" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                Quick Entry
              </button>
              <button
                type="button"
                onClick={() => setEntryMode("CHECK_IN")}
                className={`px-2 py-1 rounded transition ${
                  entryMode === "CHECK_IN" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                }`}
              >
                Track In/Out
              </button>
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleEntrySubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Swimmer Count *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={visitorCount}
                  onChange={(e) => setVisitorCount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Duration *</label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                >
                  <option value={1}>1 Hour</option>
                  <option value={1.5}>1.5 Hours</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Name (Optional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Visitor"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Phone (Optional)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="98470XXXXX"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            {/* Calculated Charge */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Standard Charge:</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {visitorCount} × {durationHours}h × ₹{ratePerHour} = ₹{calculatedCharge}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700 pt-1 border-t border-slate-200">
                <span className="font-bold">Total Payable:</span>
                <span className="text-base font-black text-cyan-800 tabular-nums">
                  ₹{isOverridden ? overrideCharge : calculatedCharge}
                </span>
              </div>
            </div>

            {/* Fee Override */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-600">Fee Override (Staff Audit)</span>
                <span className="text-[10px] text-slate-400">Leave blank if standard</span>
              </div>
              <input
                type="number"
                value={overrideCharge}
                onChange={(e) => setOverrideCharge(e.target.value)}
                placeholder="Override amount (₹)"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
              />
              {isOverridden && (
                <input
                  type="text"
                  required
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Mandatory reason for override (e.g. resident discount, early exit)"
                  className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50 rounded-lg text-xs"
                />
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-2 rounded-lg border text-center font-bold text-xs transition ${
                    paymentMethod === "CASH"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-700 bg-white"
                  }`}
                >
                  Cash Drawer
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`p-2 rounded-lg border text-center font-bold text-xs transition ${
                    paymentMethod === "UPI"
                      ? "border-cyan-600 bg-cyan-50 text-cyan-900 ring-1 ring-cyan-600"
                      : "border-slate-200 text-slate-700 bg-white"
                  }`}
                >
                  Counter UPI
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs shadow-xs transition"
            >
              {submitting ? "Recording..." : `Confirm Entry • ₹${isOverridden ? overrideCharge : calculatedCharge}`}
            </button>
          </form>
        </div>

        {/* Right Pane: Active Swimmers Ledger */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-700" />
                <span>Active Swimmers on Deck</span>
              </h2>
              <span className="text-xs font-mono font-bold text-cyan-800 tabular-nums">
                {currentOccupancy} Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Swimmers</th>
                    <th className="px-4 py-3">Check-In Time</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Paid Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {walkIns
                    .filter((w) => w.status === "ACTIVE")
                    .map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3 font-mono font-bold text-cyan-800">{w.id}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{w.visitorCount} Swimmers</td>
                        <td className="px-4 py-3 font-mono text-slate-600 tabular-nums">
                          {new Date(w.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-900">{w.customerName || "Walk-in Visitor"}</span>
                          {w.customerPhone && (
                            <span className="text-[10px] text-slate-500 block font-mono">{w.customerPhone}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-700 tabular-nums">₹{w.collectedAmount}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                            IN POOL
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleCheckOut(w.id)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] px-2.5 py-1 rounded transition flex items-center gap-1 ml-auto"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Check Out</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  {walkIns.filter((w) => w.status === "ACTIVE").length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                        No swimmers currently active in pool. Admit walk-in visitors above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Completed Walk-ins History */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Completed Walk-in Sessions Today
              </h2>
            </div>

            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Swimmers</th>
                    <th className="px-4 py-3">Entry / Exit</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Collected</th>
                    <th className="px-4 py-3">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {walkIns
                    .filter((w) => w.status === "COMPLETED")
                    .map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/60 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{w.id}</td>
                        <td className="px-4 py-3">{w.visitorCount} Swimmers</td>
                        <td className="px-4 py-3 font-mono text-slate-600 text-[11px] tabular-nums">
                          {new Date(w.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                          {w.exitTime
                            ? new Date(w.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "Departed"}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{w.customerName || "Visitor"}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">₹{w.collectedAmount}</td>
                        <td className="px-4 py-3 font-medium text-slate-600">{w.paymentMethod}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
