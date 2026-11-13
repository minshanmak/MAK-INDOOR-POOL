"use client";

import React, { useState } from "react";
import {
  X,
  FileCheck2,
  Coins,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { getPoolDate } from "@/lib/timezone";

interface EndOfDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedData?: {
    expectedCash: number;
    expectedUpi: number;
    onlineAdvances: number;
    pendingBalances: Array<{
      bookingId: string;
      customerName: string;
      customerPhone: string;
      unpaidBalance: number;
    }>;
  };
  onSuccess: () => void;
}

export default function EndOfDayModal({
  isOpen,
  onClose,
  expectedData = {
    expectedCash: 0,
    expectedUpi: 0,
    onlineAdvances: 0,
    pendingBalances: [],
  },
  onSuccess,
}: EndOfDayModalProps) {
  // Step 1: Blind Entry (Staff enters counted cash without seeing expected)
  // Step 2: Variance Revealed & Reconciliation
  const [revealed, setRevealed] = useState(false);
  const [actualCashInput, setActualCashInput] = useState<string>("");
  const [actualUpiInput, setActualUpiInput] = useState<string>("");
  const [varianceNote, setVarianceNote] = useState<string>("");
  const [managerApproval, setManagerApproval] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const actualCash = parseFloat(actualCashInput) || 0;
  const actualUpi = parseFloat(actualUpiInput) || 0;

  const cashVariance = actualCash - expectedData.expectedCash;
  const upiVariance = actualUpi - expectedData.expectedUpi;
  const totalVariance = cashVariance + upiVariance;

  const hasVariance = totalVariance !== 0;

  const handleRevealVariance = (e: React.FormEvent) => {
    e.preventDefault();
    if (actualCashInput === "") {
      setErrorMsg("Please enter the physical cash counted in the drawer.");
      return;
    }
    setErrorMsg(null);
    setRevealed(true);
  };

  const handleFinalClose = async () => {
    if (hasVariance && (!varianceNote.trim() || !managerApproval.trim())) {
      setErrorMsg("A non-zero variance requires an explanatory note and Manager Approval signature.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: getPoolDate(),
          actualCash,
          actualUpi,
          cashVariance,
          upiVariance,
          varianceReason: varianceNote.trim() || undefined,
          notes: managerApproval.trim() ? `Manager Approval: ${managerApproval}` : undefined,
          status: "SUBMITTED",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to close register.");
      }

      setSubmittedSuccess(true);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to finalize closing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-white overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Daily Register Closing
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Blind cash count &amp; end-of-day reconciliation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-extrabold text-slate-900">
                Register Closed Successfully
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Day register has been finalized and logged for audit.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] bg-slate-900 text-white font-bold text-xs rounded-2xl"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Blind Count Entry Form */}
            {!revealed ? (
              <form onSubmit={handleRevealVariance} className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 flex items-start gap-2.5 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Blind Cash Count Protocol</strong>
                    <span>
                      Count the physical cash in the drawer and total UPI settled. The system expected totals will be revealed after entry.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Physical Cash Counted in Drawer (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="Enter total counted notes & coins"
                    value={actualCashInput}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    className="w-full min-h-[48px] px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    UPI Settled Total (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Total UPI payment receipts"
                    value={actualUpiInput}
                    onChange={(e) => setActualUpiInput(e.target.value)}
                    className="w-full min-h-[48px] px-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[44px] bg-[#0284C7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-2xl transition shadow-xs flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Reveal Variance &amp; Reconcile</span>
                </button>
              </form>
            ) : (
              /* Variance Revealed Screen */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-500 block">Expected Cash</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ₹{expectedData.expectedCash.toLocaleString("en-IN")}
                    </span>
                    <div className="text-[11px] mt-1 pt-1 border-t border-slate-200/60 flex justify-between">
                      <span className="text-slate-500">Counted:</span>
                      <span className="font-bold">₹{actualCash}</span>
                    </div>
                    <div className="text-[11px] flex justify-between">
                      <span className="text-slate-500">Variance:</span>
                      <span
                        className={`font-bold ${
                          cashVariance === 0
                            ? "text-emerald-600"
                            : cashVariance > 0
                            ? "text-blue-600"
                            : "text-rose-600"
                        }`}
                      >
                        {cashVariance > 0 ? `+₹${cashVariance}` : `₹${cashVariance}`}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <span className="text-slate-500 block">Expected UPI</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ₹{expectedData.expectedUpi.toLocaleString("en-IN")}
                    </span>
                    <div className="text-[11px] mt-1 pt-1 border-t border-slate-200/60 flex justify-between">
                      <span className="text-slate-500">Counted:</span>
                      <span className="font-bold">₹{actualUpi}</span>
                    </div>
                    <div className="text-[11px] flex justify-between">
                      <span className="text-slate-500">Variance:</span>
                      <span
                        className={`font-bold ${
                          upiVariance === 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {upiVariance > 0 ? `+₹${upiVariance}` : `₹${upiVariance}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Overall Variance Banner */}
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                    totalVariance === 0
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-rose-50 border-rose-200 text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {totalVariance === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    )}
                    <div>
                      <strong className="block font-bold">
                        {totalVariance === 0
                          ? "Balanced Register (Zero Variance)"
                          : `Variance Detected: ${totalVariance > 0 ? `+₹${totalVariance}` : `₹${totalVariance}`}`}
                      </strong>
                      <span className="text-[11px]">
                        {totalVariance === 0
                          ? "Cash drawer and UPI match expected figures."
                          : "Non-zero variance requires explanation note & manager signature."}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pending Balances List (Private Bookings where balance unpaid) */}
                {expectedData.pendingBalances && expectedData.pendingBalances.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-2">
                    <span className="font-bold text-amber-900 block">
                      Pending Uncollected Balances ({expectedData.pendingBalances.length})
                    </span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {expectedData.pendingBalances.map((b) => (
                        <div
                          key={b.bookingId}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/80 border border-amber-200/60 text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{b.customerName}</span>
                            <span className="text-slate-500 ml-1">({b.bookingId})</span>
                          </div>
                          <span className="font-mono font-bold text-rose-600">
                            ₹{b.unpaidBalance} due
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variance Note and Manager Approval Inputs if non-zero variance */}
                {hasVariance && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        Variance Note / Explanation <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ₹50 customer coin shortage forgiven"
                        value={varianceNote}
                        onChange={(e) => setVarianceNote(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        Manager Approval Signature / PIN <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Manager PIN or authorization code"
                        value={managerApproval}
                        onChange={(e) => setManagerApproval(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRevealed(false)}
                    className="min-h-[44px] px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Recount
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinalClose}
                    className="flex-1 min-h-[44px] bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-2xl transition shadow-xs flex items-center justify-center gap-2"
                  >
                    {submitting ? "Closing Register..." : "Submit & Close Day Register"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
