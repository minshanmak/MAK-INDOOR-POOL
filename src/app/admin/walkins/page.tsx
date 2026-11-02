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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Walk-in Counter & Live Occupancy</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Public swimmer admission, check-in/out tracking, live capacity control, and fee overrides
          </p>
        </div>

        <div className={`px-3.5 py-2 rounded-xl border flex items-center gap-3 ${
          isNearCapacity ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-slate-200 shadow-xs"
        }`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
            isNearCapacity ? "bg-amber-500 text-white" : "bg-cyan-50 text-cyan-700"
          }`}>
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Current Swimmers</span>
            <span className="text-lg font-black text-slate-900 tabular-nums">
              {currentOccupancy} <span className="text-xs font-normal text-slate-400">/ {maxCapacity} Max</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Walk-in Form Pane */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-cyan-700" />
                Admit Walk-in Swimmer
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Quick ticketing & auto-timed entry</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Auto-Release
            </span>
          </div>

          <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
            <span>Swimmers stay active for {durationHours} hr, then auto-release. Early checkout available anytime.</span>
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
                <label className="block font-semibold text-slate-700 mb-1">Swimmer Count *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={visitorCount}
                  onChange={(e) => setVisitorCount(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duration *</label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm"
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
                <label className="block font-semibold text-slate-700 mb-1">Name (Optional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Visitor"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Calculated Rate Box */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Standard Rate:</span>
                <span>₹{ratePerHour}/person/hr</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>Calculated Charge:</span>
                <span className="text-cyan-700">₹{calculatedCharge}</span>
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
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
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
                  className="w-full px-2.5 py-1.5 border border-amber-300 bg-amber-50/50 rounded-lg"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-2 rounded-lg border text-center font-bold text-xs ${
                    paymentMethod === "CASH" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700"
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`p-2 rounded-lg border text-center font-bold text-xs ${
                    paymentMethod === "UPI" ? "border-cyan-600 bg-cyan-50 text-cyan-900" : "border-slate-200 text-slate-700"
                  }`}
                >
                  UPI QR
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-cyan-700 hover:bg-cyan-600 text-white font-bold py-2.5 rounded-lg shadow-xs transition flex items-center justify-center gap-2 text-xs"
            >
              <UserPlus className="w-4 h-4" />
              {submitting
                ? "Admitting Swimmer..."
                : `Admit Swimmer & Collect ₹${isOverridden ? overrideCharge : calculatedCharge}`}
            </button>
          </form>
        </div>

        {/* Walk-in Records Table */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-slate-100 flex justify-between items-center text-xs">
            <h2 className="font-bold text-slate-900">Today's Walk-in Swimmers Log</h2>
            <span className="text-slate-500">Auto-refreshing</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading records...</div>
            ) : walkIns.length > 0 ? (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Swimmers</th>
                    <th className="px-4 py-3">Entry Time</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {walkIns.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          w.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{w.visitorCount} Person(s)</td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {formatPoolTime(w.checkInTime)}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{w.durationHours || 1} Hr(s)</td>
                      <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">
                        ₹{w.collectedAmount}
                        {w.overrideReason && (
                          <span className="block text-[10px] text-amber-700 font-normal">
                            (Override: {w.overrideReason})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold uppercase">{w.paymentMethod}</td>
                      <td className="px-4 py-3 text-right">
                        {w.status === "ACTIVE" && (
                          <button
                            onClick={() => handleCheckOut(w.id)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-xs"
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
