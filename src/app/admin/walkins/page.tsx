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

      // Reset form
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
      {/* Header & Live Counter Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Walk-in Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time public check-in/out, rapid cash/UPI entry, live pool occupancy, and fee overrides
          </p>
        </div>

        <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 ${
          isNearCapacity ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className={`p-2 rounded-xl ${isNearCapacity ? "bg-amber-500 text-white" : "bg-ocean-100 text-ocean-700"}`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-500">Live Pool Occupancy</span>
            <span className="text-xl font-black text-slate-900">
              {currentOccupancy} <span className="text-xs font-normal text-slate-400">/ {maxCapacity} Max</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Walk-in Entry Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-ocean-600" />
              New Walk-in Swimmer
            </h2>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setEntryMode("QUICK")}
                className={`px-2 py-1 rounded-md transition ${entryMode === "QUICK" ? "bg-white text-ocean-950 shadow-xs" : "text-slate-500"}`}
              >
                Quick Entry
              </button>
              <button
                type="button"
                onClick={() => setEntryMode("CHECK_IN")}
                className={`px-2 py-1 rounded-md transition ${entryMode === "CHECK_IN" ? "bg-white text-ocean-950 shadow-xs" : "text-slate-500"}`}
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
                <label className="block font-semibold text-slate-700 mb-1">Visitor Count *</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Duration (Hrs) *</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
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
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Standard Rate:</span>
                <span>₹{ratePerHour}/person/hr</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm">
                <span>Calculated Charge:</span>
                <span className="text-ocean-700">₹{calculatedCharge}</span>
              </div>
            </div>

            {/* Charge Override */}
            <div className="pt-1">
              <label className="block font-semibold text-slate-700 mb-1">
                Authorized Override Charge (Optional)
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
                  Mandatory Reason for Fee Override *
                </label>
                <textarea
                  required
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Approved discount / Owner guest / Swim coach pass"
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
                  className={`p-2 rounded-lg border text-center font-bold ${
                    paymentMethod === "CASH" ? "border-ocean-600 bg-ocean-50 text-ocean-950" : "border-slate-200"
                  }`}
                >
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("UPI")}
                  className={`p-2 rounded-lg border text-center font-bold ${
                    paymentMethod === "UPI" ? "border-lagoon-600 bg-lagoon-50 text-lagoon-950" : "border-slate-200"
                  }`}
                >
                  UPI QR
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-2.5 rounded-xl shadow transition"
            >
              {submitting
                ? "Recording..."
                : entryMode === "QUICK"
                ? `Confirm Quick Entry (Collect ₹${isOverridden ? overrideCharge : calculatedCharge})`
                : "Check In Swimmer"}
            </button>
          </form>
        </div>

        {/* Walk-in Records Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 text-sm">Today's Walk-in Swimmers</h2>
            <span className="text-xs text-slate-500">Live Counter Log</span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading records...</div>
            ) : walkIns.length > 0 ? (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
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
                    <tr key={w.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          w.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">{w.visitorCount} Person(s)</td>
                      <td className="px-4 py-3 font-mono">{new Date(w.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-4 py-3">{w.durationHours || 1} Hr(s)</td>
                      <td className="px-4 py-3 font-bold text-slate-900">
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
                            className="bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-xs"
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
