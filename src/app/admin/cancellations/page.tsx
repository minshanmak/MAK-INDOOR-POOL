"use client";

import React, { useState, useEffect } from "react";
import { formatPoolDate, formatSlotTime } from "@/lib/timezone";
import {
  XCircle,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  ShieldAlert,
  ArrowRight,
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
    try {
      const res = await fetch("/api/admin/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_CANCELLATION",
          bookingId,
          reason: "Approved by management upon review",
        }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to approve cancellation.");
      }
      setActionSuccess("Cancellation approved and pool slot successfully released!");
      fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to approve cancellation.");
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
    return <div className="p-8 text-center text-slate-400 text-xs">Loading cancellations & refunds ledger...</div>;
  }

  const { cancellationRequests = [], refunds = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cancellations & Refunds</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Process customer cancellation requests, safely release reserved pool slots, and manage Owner-approved refunds
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Customer Cancellation Requests */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Customer Cancellation Requests ({cancellationRequests.length})
            </h2>
            <span className="text-[11px] text-slate-500">
              Rule: A cancellation request does NOT release the slot until an authorized manager approves it.
            </span>
          </div>
        </div>

        {cancellationRequests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Scheduled Slot</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Customer Reason</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Slot Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cancellationRequests.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-800">{b.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{formatPoolDate(b.bookingDate)}</div>
                      <div className="text-[11px] text-slate-500 tabular-nums">{formatSlotTime(b.startTime)} – {formatSlotTime(b.endTime)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{b.customerName}</div>
                      <div className="text-[10px] text-slate-500">{b.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-amber-900 font-medium">
                      {b.cancellationReason}
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700 tabular-nums">₹{b.totalPaid}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.status === "CONFIRMED"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}>
                        {b.status === "CONFIRMED" ? "LOCKED (PENDING)" : "CANCELLED"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {b.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleApproveCancellation(b.id)}
                          className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xs"
                        >
                          Approve & Release Slot
                        </button>
                      )}
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

      {/* Section 2: Owner-Controlled Refunds Ledger */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs">
          <div>
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              Refund Requests Ledger ({refunds.length})
            </h2>
            <span className="text-[11px] text-slate-500">
              Rule: Refund decisions and amounts are strictly Pool Owner only.
            </span>
          </div>
        </div>

        {refunds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Requested Amount</th>
                  <th className="px-4 py-3">Approved Amount</th>
                  <th className="px-4 py-3">Refund Status</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Txn Reference</th>
                  <th className="px-4 py-3 text-right">Owner Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-800">{r.bookingId}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 tabular-nums">₹{r.requestedAmount}</td>
                    <td className="px-4 py-3 font-bold text-emerald-700 tabular-nums">₹{r.approvedAmount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : r.status === "PROCESSED"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : r.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{r.reason}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-500">{r.transactionRef || "Pending"}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "PENDING" && (
                        <button
                          onClick={() => {
                            setSelectedRefund(r);
                            setApprovedAmount(r.requestedAmount);
                          }}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-xs"
                        >
                          Decide Refund
                        </button>
                      )}
                      {r.status === "APPROVED" && (
                        <button
                          onClick={() => {
                            setSelectedRefund(r);
                            handleDecideRefund("MARK_PROCESSED");
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-xs"
                        >
                          Mark Processed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No refund records in ledger.
          </div>
        )}
      </div>

      {/* Owner Refund Decision Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Owner Refund Decision</h3>
            <p className="text-xs text-slate-500 font-mono">Booking Ref: {selectedRefund.bookingId}</p>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Customer Requested:</span>
                <span className="font-bold">₹{selectedRefund.requestedAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Reason:</span>
                <span className="text-slate-700">{selectedRefund.reason}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-semibold text-slate-700">Approved Refund Amount (₹)</label>
              <input
                type="number"
                min={0}
                max={selectedRefund.requestedAmount}
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="pt-2 flex justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedRefund(null)}
                className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecideRefund("REJECT")}
                  className="px-3 py-2 rounded-lg bg-rose-50 text-rose-800 font-bold hover:bg-rose-100 border border-rose-200"
                >
                  Reject Refund
                </button>
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleDecideRefund("APPROVE")}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {processing ? "Processing..." : `Approve ₹${approvedAmount}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
