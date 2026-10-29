"use client";

import React, { useState, useEffect } from "react";
import {
  XCircle,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  ShieldAlert,
  ArrowRight,
  Shield,
  X,
  Clock,
  Lock,
} from "lucide-react";

export default function AdminCancellationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Refund Decision Modal State
  const [selectedRefund, setSelectedRefund] = useState<any | null>(null);
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // Cancellation Confirmation Modal State
  const [confirmCancellationBooking, setConfirmCancellationBooking] = useState<any | null>(null);
  const [approving, setApproving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cancellations");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching cancellations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveCancellation = async (bookingId: string) => {
    setError(null);
    setActionSuccess(null);
    setApproving(true);
    try {
      const res = await fetch("/api/admin/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_CANCELLATION",
          bookingId,
          reason: "Approved by manager upon review",
        }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to approve cancellation.");
      }
      setActionSuccess("Cancellation approved and pool slot successfully released!");
      setConfirmCancellationBooking(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to approve cancellation.");
    } finally {
      setApproving(false);
    }
  };

  const handleDecideRefund = async (decision: "APPROVE" | "REJECT" | "MARK_PROCESSED") => {
    if (!selectedRefund) return;
    setProcessing(true);
    setError(null);
    setActionSuccess(null);
    try {
      const res = await fetch("/api/admin/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DECIDE_REFUND",
          refundId: selectedRefund.id,
          decision,
          approvedAmount,
          transactionRef: `REFUND-TXN-${Date.now()}`,
        }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to submit refund decision.");
      }
      setActionSuccess(`Refund decision [${decision}] recorded successfully.`);
      setSelectedRefund(null);
      fetchData();
    } catch (err: any) {
      setError(err.message || "Error processing refund.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-mono">
        <div className="inline-flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading cancellations & refunds ledger...</span>
        </div>
      </div>
    );
  }

  const { pendingRequests = [], refunds = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200/90 pb-4">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-800 font-semibold mb-1">
          <Shield className="w-3.5 h-3.5" />
          <span>GOVERNANCE & SLOT RELEASE AUDITS</span>
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Cancellations & Refund Queue</h1>
        <p className="text-xs text-slate-500">
          Authorize cancellation approvals to release locked slots, and process Owner-only refund decisions
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Module 1: Pending Cancellation Requests */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Pending Slot Cancellation Requests ({pendingRequests.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Approving a request releases the locked slot for public re-booking.
            </p>
          </div>
        </div>

        {pendingRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Session Date & Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Cancellation Reason</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRequests.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-800">{b.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 tabular-nums">
                      {b.bookingDate} ({b.startTime} – {b.endTime})
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{b.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{b.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700 tabular-nums">₹{b.totalPaid}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">{b.cancellationReason}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setConfirmCancellationBooking(b)}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-md shadow-xs transition"
                      >
                        Approve & Release Slot
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No pending cancellation requests in queue.
          </div>
        )}
      </div>

      {/* Module 2: Refund Ledger */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Owner Refund Governance Ledger ({refunds.length})
              </h2>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 font-bold uppercase px-1.5 py-0.5 rounded border border-cyan-800/60 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>OWNER-ONLY</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Staff cannot decide refunds. Only the Pool Owner account can approve or reject refund amounts.
            </p>
          </div>
        </div>

        {refunds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Refund Ref</th>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Original Payment</th>
                  <th className="px-4 py-3">Refund Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Decided At</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{r.id}</td>
                    <td className="px-4 py-3 font-mono text-cyan-800">{r.bookingId}</td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">
                      {r.paymentId ? `Payment #${r.paymentId}` : "N/A"}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">₹{r.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : r.status === "APPROVED"
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : r.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px] tabular-nums">
                      {r.processedAt ? new Date(r.processedAt).toLocaleString() : "Pending Owner Review"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "REQUESTED" ? (
                        <button
                          onClick={() => {
                            setSelectedRefund(r);
                            setApprovedAmount(r.amount);
                            setDecisionNotes("");
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] px-2.5 py-1 rounded transition"
                        >
                          Review & Decide
                        </button>
                      ) : r.status === "APPROVED" ? (
                        <button
                          onClick={() => {
                            setSelectedRefund(r);
                            setApprovedAmount(r.amount);
                            setDecisionNotes("");
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1 rounded transition"
                        >
                          Mark Processed
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Finalized</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No refunds in ledger.
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Guard Modal */}
      {confirmCancellationBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Confirm Slot Release</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Ref: {confirmCancellationBooking.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmCancellationBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="font-bold text-slate-900 font-sans">
                    {confirmCancellationBooking.customerName} ({confirmCancellationBooking.customerPhone})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Session Date:</span>
                  <span className="font-bold text-slate-900">
                    {confirmCancellationBooking.bookingDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time Slot:</span>
                  <span className="font-bold text-slate-900">
                    {confirmCancellationBooking.startTime} – {confirmCancellationBooking.endTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Paid Amount:</span>
                  <span className="font-bold text-emerald-700 font-sans">
                    ₹{confirmCancellationBooking.totalPaid}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] leading-relaxed">
                <strong>Attention:</strong> Approving this request will cancel this customer booking and immediately release the locked slot back into the live public booking inventory on the website.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={approving}
                  onClick={() => setConfirmCancellationBooking(null)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition"
                >
                  Cancel / Keep Locked
                </button>
                <button
                  type="button"
                  disabled={approving}
                  onClick={() => handleApproveCancellation(confirmCancellationBooking.id)}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition"
                >
                  {approving ? "Releasing..." : "Confirm & Release Slot"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Owner Refund Decision Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Pool Owner Refund Decision</h3>
                <p className="text-xs text-slate-500 font-mono">Refund ID: {selectedRefund.id}</p>
              </div>
              <button
                onClick={() => setSelectedRefund(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Booking Reference:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedRefund.bookingId}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Customer Requested:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    ₹{selectedRefund.amount}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Current State:</span>
                  <span className="font-bold text-amber-700">{selectedRefund.status}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Approved Refund Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  max={selectedRefund.amount}
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Adjust if deducting administrative cancellation fee as per policy
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Decision Notes & Audit Reason
                </label>
                <textarea
                  rows={2}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="e.g. Approved full advance refund; cancelled 14h prior as per policy."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecideRefund("REJECT")}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 text-xs transition"
                >
                  Reject Refund
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecideRefund("APPROVE")}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 text-xs transition"
                >
                  Approve ₹{approvedAmount}
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecideRefund("MARK_PROCESSED")}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  Mark Verified & Paid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
