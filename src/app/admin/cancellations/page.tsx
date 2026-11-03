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
  ChevronRight,
  X,
} from "lucide-react";

export default function AdminCancellationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Active Tab: "REQUESTS" | "REFUNDS" | "ALL"
  const [activeTab, setActiveTab] = useState<"REQUESTS" | "REFUNDS" | "ALL">("REQUESTS");

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

  const { cancellationRequests = [], refunds = [] } = data || {};

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Filter Tabs (Exact Mockup Match) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("REQUESTS")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "REQUESTS"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
          }`}
        >
          Cancellation Requests ({cancellationRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("REFUNDS")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "REFUNDS"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
          }`}
        >
          Refunds ({refunds.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "ALL"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
          }`}
        >
          All
        </button>
      </div>

      {/* Main Table Card (Exact Mockup Match) */}
      <div className="bg-white rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading ledger...</div>
        ) : activeTab === "REQUESTS" || activeTab === "ALL" ? (
          <div className="overflow-x-auto">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="font-extrabold text-xs text-slate-800">
                Cancellation Requests Queue
              </span>
              <span className="text-[11px] text-slate-400">
                Authorized review releases slot
              </span>
            </div>
            {cancellationRequests.length > 0 ? (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Request ID</th>
                    <th className="px-5 py-3.5">Booking</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5">Request Date</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cancellationRequests.map((b: any, idx: number) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-700">
                        CR-{1008 + idx}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-extrabold text-[#1D68BD]">
                        {b.id}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {b.customerName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                        {b.cancellationReason || "Customer schedule change"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono">
                        {formatPoolDate(b.bookingDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80">
                          {b.status === "CONFIRMED" ? "Pending" : "Cancelled"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {b.status === "CONFIRMED" ? (
                          <button
                            onClick={() => handleApproveCancellation(b.id)}
                            className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-xs transition"
                          >
                            Approve & Release
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Released</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No pending cancellation requests in queue.
              </div>
            )}
          </div>
        ) : null}

        {/* Refunds Sub-Table (if Refunds or All selected) */}
        {(activeTab === "REFUNDS" || activeTab === "ALL") && (
          <div className="overflow-x-auto border-t border-slate-100">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <span className="font-extrabold text-xs text-slate-800">
                Refund Requests & Settlements
              </span>
              <span className="text-[11px] text-slate-400">
                Owner approval strictly enforced
              </span>
            </div>
            {refunds.length > 0 ? (
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Booking ID</th>
                    <th className="px-5 py-3.5">Requested Amount</th>
                    <th className="px-5 py-3.5">Approved Amount</th>
                    <th className="px-5 py-3.5">Refund Status</th>
                    <th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refunds.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#1D68BD]">
                        {r.bookingId}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 tabular-nums">
                        ₹{r.requestedAmount}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-emerald-700 tabular-nums">
                        ₹{r.approvedAmount}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                            r.status === "APPROVED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : r.status === "PROCESSED"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : r.status === "REJECTED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate">
                        {r.reason || "Customer refund"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {r.status === "PENDING" ? (
                          <button
                            onClick={() => {
                              setSelectedRefund(r);
                              setApprovedAmount(r.requestedAmount);
                            }}
                            className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-xs transition"
                          >
                            Review Refund
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No refund requests recorded.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Review Refund Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Owner Refund Decision</h3>
              <button
                onClick={() => setSelectedRefund(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
              <div className="flex justify-between font-semibold">
                <span>Booking ID:</span>
                <span className="font-mono text-[#1D68BD]">{selectedRefund.bookingId}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Requested:</span>
                <span className="font-bold text-slate-900">₹{selectedRefund.requestedAmount}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Approved Amount (₹)</label>
              <input
                type="number"
                min={0}
                max={selectedRefund.requestedAmount}
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => handleDecideRefund("REJECT")}
                className="flex-1 py-2.5 rounded-xl bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 text-xs"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => handleDecideRefund("APPROVE")}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 text-xs"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => handleDecideRefund("MARK_PROCESSED")}
                className="flex-1 py-2.5 rounded-xl bg-[#1D68BD] text-white font-bold hover:bg-[#155299] text-xs"
              >
                Processed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
