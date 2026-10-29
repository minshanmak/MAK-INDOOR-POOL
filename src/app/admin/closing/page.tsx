"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Receipt,
  Calendar,
  Lock,
} from "lucide-react";

export default function AdminClosingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split("T")[0]);

  // Reconciliation inputs
  const [actualCash, setActualCash] = useState<number | string>("");
  const [actualUpi, setActualUpi] = useState<number | string>("");
  const [varianceReason, setVarianceReason] = useState("");
  const [closingNotes, setClosingNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchClosingData = async (dateStr: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/closing?date=${dateStr}`);
      const json = await res.json();
      setData(json);

      if (json.closingRecord) {
        setActualCash(json.closingRecord.actualCash);
        setActualUpi(json.closingRecord.actualUpi);
        setVarianceReason(json.closingRecord.varianceReason || "");
        setClosingNotes(json.closingRecord.notes || "");
      } else {
        setActualCash(json.expectedCollections.cash);
        setActualUpi(json.expectedCollections.upi);
        setVarianceReason("");
        setClosingNotes("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClosingData(targetDate);
  }, [targetDate]);

  const expectedCash = data?.expectedCollections?.cash || 0;
  const expectedUpi = data?.expectedCollections?.upi || 0;
  const expectedGateway = data?.expectedCollections?.gateway || 0;

  const actCashNum = Number(actualCash) || 0;
  const actUpiNum = Number(actualUpi) || 0;

  const cashVariance = Math.round((actCashNum - expectedCash) * 100) / 100;
  const upiVariance = Math.round((actUpiNum - expectedUpi) * 100) / 100;
  const totalVariance = Math.round((cashVariance + upiVariance) * 100) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalVariance !== 0 && !varianceReason.trim()) {
      setFeedback({
        type: "error",
        msg: "A mandatory discrepancy reason is required when actual collections do not match expected records.",
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: targetDate,
          actualCash: actCashNum,
          actualUpi: actUpiNum,
          varianceReason,
          notes: closingNotes,
        }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to submit closing.");
      }
      setFeedback({
        type: "success",
        msg: "End-of-day register reconciliation successfully submitted and recorded into authoritative audit trail!",
      });
      fetchClosingData(targetDate);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to submit closing." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Date Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-800 font-semibold mb-1">
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>DAILY RECONCILIATION & REGISTER AUDIT</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">End-of-Day Closing Sheet</h1>
          <p className="text-xs text-slate-500">
            Reconcile physical cash drawer and counter UPI receipts against authoritative system records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="text-xs font-mono text-slate-900 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Expected Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider">
              1. System Expected Record
            </span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            ₹{expectedCash + expectedUpi}
          </div>
          <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100 tabular-nums">
            <div className="flex justify-between">
              <span>Expected Cash Drawer:</span>
              <span className="font-bold text-slate-900">₹{expectedCash}</span>
            </div>
            <div className="flex justify-between">
              <span>Expected Counter UPI:</span>
              <span className="font-bold text-slate-900">₹{expectedUpi}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Direct Online Gateway:</span>
              <span>₹{expectedGateway}</span>
            </div>
          </div>
        </div>

        {/* Counted Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase font-bold text-cyan-700 tracking-wider">
              2. Physical Register Count
            </span>
            <IndianRupee className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-cyan-900 tabular-nums">
            ₹{actCashNum + actUpiNum}
          </div>
          <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100 tabular-nums">
            <div className="flex justify-between">
              <span>Actual Physical Cash:</span>
              <span className="font-bold text-slate-900">₹{actCashNum}</span>
            </div>
            <div className="flex justify-between">
              <span>Actual UPI Bank Settlement:</span>
              <span className="font-bold text-slate-900">₹{actUpiNum}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Staff Signoff:</span>
              <span>{data?.closingRecord?.closedByUser?.name || "Pending"}</span>
            </div>
          </div>
        </div>

        {/* Variance Card */}
        <div
          className={`p-5 rounded-xl border shadow-xs space-y-3 ${
            totalVariance === 0
              ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
              : totalVariance < 0
              ? "bg-rose-50/50 border-rose-200 text-rose-950"
              : "bg-amber-50/50 border-amber-200 text-amber-950"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
              3. Calculated Variance
            </span>
            {totalVariance >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className="text-2xl font-black tabular-nums">
            {totalVariance > 0 ? `+₹${totalVariance}` : `₹${totalVariance}`}
          </div>
          <div className="space-y-1 text-xs pt-2 border-t border-slate-200/60 tabular-nums">
            <div className="flex justify-between">
              <span>Cash Discrepancy:</span>
              <span className="font-bold">
                {cashVariance > 0 ? `+₹${cashVariance}` : `₹${cashVariance}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span>UPI Discrepancy:</span>
              <span className="font-bold">
                {upiVariance > 0 ? `+₹${upiVariance}` : `₹${upiVariance}`}
              </span>
            </div>
            <div className="text-[11px]">
              {totalVariance === 0 ? "Perfect zero-variance balance." : "Explanation mandatory below."}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-4"
      >
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Reconciliation Form Inputs for {targetDate}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">
              Actual Physical Cash in Till (₹) *
            </label>
            <input
              type="number"
              step="any"
              required
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">
              Actual Verified UPI Receipts (₹) *
            </label>
            <input
              type="number"
              step="any"
              required
              value={actualUpi}
              onChange={(e) => setActualUpi(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
            />
          </div>
        </div>

        {totalVariance !== 0 && (
          <div>
            <label className="block font-bold text-rose-700 mb-1 text-[11px]">
              Mandatory Explanation Reason for Variance (₹{totalVariance}) *
            </label>
            <input
              type="text"
              required
              value={varianceReason}
              onChange={(e) => setVarianceReason(e.target.value)}
              placeholder="e.g. ₹50 change shortage given to customer / delayed UPI bank credit"
              className="w-full px-3 py-2 border border-rose-300 rounded-lg text-xs text-slate-900 bg-rose-50/30"
            />
          </div>
        )}

        <div>
          <label className="block font-bold text-slate-700 mb-1 text-[11px]">
            General Closing Notes & Shift Handover Remarks
          </label>
          <textarea
            rows={2}
            value={closingNotes}
            onChange={(e) => setClosingNotes(e.target.value)}
            placeholder="e.g. Night shift chemical levels balanced; skimmers cleared."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs shadow-xs transition"
          >
            {submitting ? "Submitting Register..." : "Submit Daily Closing Reconciliation"}
          </button>
        </div>
      </form>
    </div>
  );
}
