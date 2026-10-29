"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
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
      setFeedback({ type: "success", msg: "Daily closing reconciliation submitted and saved!" });
      fetchClosingData(targetDate);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to submit closing." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">End-of-Day Closing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cash, UPI, and online gateway collections reconciliation, variance auditing, and shift sign-off
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Select Date:</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
          />
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          feedback.type === "success"
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading closing figures...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Pane */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-ocean-600" />
                Closing Reconciliation Sheet ({targetDate})
              </h2>
              {data?.closingRecord && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  {data.closingRecord.status} by {data.closingRecord.closedByUser?.name || "Staff"}
                </span>
              )}
            </div>

            {/* Expected Summary Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block">System Expected Cash</span>
                <strong className="text-base text-slate-900 block mt-0.5">₹{expectedCash}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block">System Expected UPI</span>
                <strong className="text-base text-slate-900 block mt-0.5">₹{expectedUpi}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block">Online Gateway</span>
                <strong className="text-base text-ocean-700 block mt-0.5">₹{expectedGateway}</strong>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Actual Physical Cash Counted (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <div className="mt-1 flex items-center gap-1 text-[11px]">
                    <span className="text-slate-500">Variance:</span>
                    <strong className={cashVariance === 0 ? "text-emerald-600" : "text-red-600"}>
                      ₹{cashVariance}
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Actual UPI Bank Statement Total (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={actualUpi}
                    onChange={(e) => setActualUpi(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <div className="mt-1 flex items-center gap-1 text-[11px]">
                    <span className="text-slate-500">Variance:</span>
                    <strong className={upiVariance === 0 ? "text-emerald-600" : "text-red-600"}>
                      ₹{upiVariance}
                    </strong>
                  </div>
                </div>
              </div>

              {totalVariance !== 0 && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5">
                  <label className="block font-bold text-amber-900">
                    Mandatory Discrepancy Note (Net Variance: ₹{totalVariance}) *
                  </label>
                  <p className="text-[11px] text-amber-800">
                    Rule: Whenever physical cash or UPI differs from expected system collections, an audit explanation must be provided.
                  </p>
                  <textarea
                    required
                    rows={2}
                    value={varianceReason}
                    onChange={(e) => setVarianceReason(e.target.value)}
                    placeholder="e.g. Returned ₹150 change from previous day / bank UPI settlement delayed by 1 hour"
                    className="w-full px-3 py-1.5 border border-amber-300 bg-white rounded-lg text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Closing Notes</label>
                <textarea
                  rows={2}
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                  placeholder="General remarks on pool attendance, weather, or operational incidents..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-2.5 rounded-xl text-sm transition shadow"
              >
                {submitting ? "Submitting..." : "Submit & Sign Off Daily Closing"}
              </button>
            </form>
          </div>

          {/* Operational Day Summary Pane */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Operational Statistics ({targetDate})
            </h3>

            <div className="space-y-3 text-slate-600">
              <div className="flex justify-between">
                <span>Bookings Count:</span>
                <strong className="text-slate-900">{data.bookingsCount} Sessions</strong>
              </div>
              <div className="flex justify-between">
                <span>Walk-in Swimmers:</span>
                <strong className="text-slate-900">{data.walkInsCount} Groups</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Swimmers Today:</span>
                <strong className="text-emerald-700 font-bold">{data.totalGuests} Swimmers</strong>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Collections:</span>
                <span className="text-ocean-700">₹{expectedCash + expectedUpi + expectedGateway}</span>
              </div>
            </div>

            {/* Recent Closings */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <span className="font-bold text-slate-700 block">Recent Daily Closings</span>
              <div className="space-y-1.5">
                {data.recentClosings?.map((rc: any) => (
                  <button
                    key={rc.id}
                    onClick={() => setTargetDate(rc.date)}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 flex justify-between items-center text-[11px]"
                  >
                    <span className="font-semibold text-slate-800">{rc.date}</span>
                    <span className="text-emerald-700 font-bold">₹{rc.totalCollections}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
