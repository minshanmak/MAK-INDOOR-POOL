"use client";

import React, { useState, useEffect } from "react";
import { formatPoolTime } from "@/lib/timezone";
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
} from "lucide-react";

export default function AdminWalkinsPage() {
  const [walkIns, setWalkIns] = useState<any[]>([]);
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [loading, setLoading] = useState(true);

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
          action: "CHECK_IN",
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Walk-in Counter & Occupancy</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Public swimmer admission, live pool capacity control, and quick fee collection
          </p>
        </div>

        <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3.5 transition-all ${
          isNearCapacity
            ? "bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs"
            : "bg-white border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)]"
        }`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
            isNearCapacity ? "bg-amber-500" : "bg-gradient-to-br from-cyan-500 to-blue-600"
          }`}>
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Swimmers</span>
            <span className="text-xl font-black text-slate-900 tabular-nums tracking-tight">
              {currentOccupancy} <span className="text-xs font-medium text-slate-400">/ {maxCapacity} Max</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Walk-in Admission Card (iOS Inset Card) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#007AFF]" />
                Admit Walk-in Swimmer
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Quick ticketing & auto-timed entry</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Auto-Release
            </span>
          </div>

          <div className="text-[11px] text-slate-600 bg-slate-50/80 border border-slate-200/80 rounded-2xl px-3 py-2 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
            <span>Swimmers stay active for {durationHours} hr, then auto-release. Early checkout available anytime.</span>
          </div>

          {formError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-2xl text-xs flex items-start gap-1.5 border border-red-200/60">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleEntrySubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Swimmer Count *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={visitorCount}
                  onChange={(e) => setVisitorCount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duration *</label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
                >
                  <option value={1}>1 Hour</option>
                  <option value={1.5}>1.5 Hours</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Name (Optional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Visitor"
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
                />
              </div>
            </div>

            {/* Calculated Rate Box (iOS Inset Pill) */}
            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between text-slate-500 font-medium">
                <span>Standard Rate:</span>
                <span>₹{ratePerHour}/person/hr</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-0.5">
                <span>Calculated Charge:</span>
                <span className="text-[#007AFF]">₹{calculatedCharge}</span>
              </div>
            </div>

            {/* Override Option */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Authorized Override Fee (Optional)
              </label>
              <input
                type="number"
                min={0}
                value={overrideCharge}
                onChange={(e) => setOverrideCharge(e.target.value)}
                placeholder="Leave blank for standard charge"
                className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#007AFF]/20 transition-all"
              />
            </div>

            {isOverridden && (
              <div className="space-y-1">
                <label className="block font-bold text-amber-900 mb-0.5">
                  Mandatory Audit Reason for Override *
                </label>
                <textarea
                  required
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Coach pass / owner approval / group package"
                  className="w-full px-3 py-2 border border-amber-300 bg-amber-50/60 rounded-xl text-xs"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Payment Method</label>
              {/* iOS Segmented Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`py-2 rounded-xl text-center font-bold text-xs transition-all active:scale-95 ${
                    paymentMethod === "CASH"
                      ? "bg-white text-slate-900 shadow-xs ring-1 ring-black/5"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`py-2 rounded-xl text-center font-bold text-xs transition-all active:scale-95 ${
                    paymentMethod === "UPI"
                      ? "bg-white text-[#007AFF] shadow-xs ring-1 ring-black/5"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  UPI QR
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#007AFF] hover:bg-[#0066DD] active:scale-[0.98] text-white font-bold py-3 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
            >
              <UserPlus className="w-4 h-4" />
              {submitting
                ? "Admitting Swimmer..."
                : `Admit Swimmer & Collect ₹${isOverridden ? overrideCharge : calculatedCharge}`}
            </button>
          </form>
        </div>

        {/* Walk-in Records Table (iOS Inset Grouped Table) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-black/[0.04] shadow-[0_2px_16px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center text-xs">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              Today's Walk-in Swimmers Log
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">Auto-refreshing</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading records...</div>
            ) : walkIns.length > 0 ? (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Swimmers</th>
                    <th className="px-5 py-3">Entry Time</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Mode</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {walkIns.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          w.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{w.visitorCount} Person(s)</td>
                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        {formatPoolTime(w.checkInTime)}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums">{w.durationHours || 1} Hr(s)</td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 tabular-nums">
                        ₹{w.collectedAmount}
                        {w.overrideReason && (
                          <span className="block text-[10px] text-amber-700 font-normal">
                            (Override: {w.overrideReason})
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold uppercase">{w.paymentMethod}</td>
                      <td className="px-5 py-3.5 text-right">
                        {w.status === "ACTIVE" && (
                          <button
                            onClick={() => handleCheckOut(w.id)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-xs active:scale-95 transition"
                          >
                            Check Out
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">No walk-in visitors recorded yet today.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
