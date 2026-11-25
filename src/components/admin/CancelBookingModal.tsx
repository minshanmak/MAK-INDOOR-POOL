"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  Users,
  IndianRupee,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  Send,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { formatSlotTime } from "@/lib/timezone";

interface CancelBookingModalProps {
  booking: any | null;
  isOpen: boolean;
  userRole?: string;
  onClose: () => void;
  onSuccess: (result: any) => void;
}

const QUICK_REASONS = [
  "Customer Called to Cancel",
  "No-Show / Abandoned Slot",
  "Duplicate / Mistake Entry",
  "Emergency / Health Issue",
  "Weather / Pool Maintenance",
  "Customer Requested Date Shift",
];

export default function CancelBookingModal({
  booking,
  isOpen,
  userRole = "STAFF",
  onClose,
  onSuccess,
}: CancelBookingModalProps) {
  const isOwnerOrAdmin = userRole === "POOL_OWNER" || userRole === "SUPER_ADMIN";

  const [reason, setReason] = useState("");
  const [refundDecision, setRefundDecision] = useState<"FULL_REFUND" | "PARTIAL_REFUND" | "NO_REFUND">("FULL_REFUND");
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [markProcessed, setMarkProcessed] = useState(false);
  const [refundRef, setRefundRef] = useState("Counter Cash");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (booking) {
      setReason("");
      setErrorMsg(null);
      setRefundDecision("FULL_REFUND");
      setPartialAmount(booking.totalPaid || 0);
      setMarkProcessed(false);
      setRefundRef("Counter Cash");
      setNotifyCustomer(true);
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const isCheckedIn = booking.checkInStatus === "CHECKED_IN";
  const isCancelled = booking.status === "CANCELLED";
  const isFamily = booking.type === "FAMILY";
  const totalPaid = Number(booking.totalPaid || 0);

  const calculatedRefund =
    refundDecision === "NO_REFUND"
      ? 0
      : refundDecision === "PARTIAL_REFUND"
      ? Math.max(0, Math.min(totalPaid, Number(partialAmount) || 0))
      : totalPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg("Please provide a reason for cancellation.");
      return;
    }

    if (isCheckedIn) {
      setErrorMsg("Cannot cancel a booking where guests are already checked in.");
      return;
    }

    if (isCancelled) {
      setErrorMsg("This booking has already been cancelled.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (isOwnerOrAdmin) {
        // Direct Owner Cancellation & Slot Release
        const res = await fetch("/api/admin/cancellations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "APPROVE_CANCELLATION",
            bookingId: booking.id,
            reason: reason.trim(),
            refundDecision,
            refundAmount: calculatedRefund,
            markProcessed,
            refundRef: markProcessed ? refundRef.trim() : undefined,
            notifyCustomer,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to cancel booking.");
        }
        onSuccess(data);
      } else {
        // Staff Cancellation Request (Queues for owner review)
        const res = await fetch("/api/admin/cancellations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REQUEST_CANCELLATION",
            bookingId: booking.id,
            reason: reason.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to submit cancellation request.");
        }
        onSuccess(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred while processing cancellation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {isOwnerOrAdmin ? "Cancel Booking" : "Request Cancellation"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Pass ID: <span className="font-mono text-slate-200 font-semibold">{booking.id}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                isFamily
                  ? "bg-purple-900/60 text-purple-200 border border-purple-700/50"
                  : "bg-blue-900/60 text-blue-200 border border-blue-700/50"
              }`}
            >
              {isFamily ? "Family Exclusive" : "Public Session"}
            </span>

            <div className="flex items-center gap-2 text-[11px]">
              <span>Paid: <strong className="text-emerald-400 tabular-nums">₹{totalPaid}</strong></span>
              <span>&bull;</span>
              <span>Due: <strong className="text-white tabular-nums">₹{booking.balanceAmount || 0}</strong></span>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Guardrails Warning */}
          {isCheckedIn && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Guests Already Checked In</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  This booking cannot be cancelled because the party has already passed admission reception.
                </p>
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="p-3.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl flex items-center gap-2 font-medium">
              <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
              <span>This booking is already cancelled.</span>
            </div>
          )}

          {/* Booking Summary Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-bold text-slate-900">{booking.customerName}</span>
              <span className="font-mono text-[11px] text-slate-500">{booking.customerPhone}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 text-[11px]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-800">{booking.bookingDate}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-800">
                  {formatSlotTime(booking.startTime)} – {formatSlotTime(booking.endTime)}
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-800">{booking.guestCount} Swimmers</span>
              </span>
            </div>
          </div>

          {/* Quick Reason Chips */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Quick Reason Chips
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setReason(chip)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition ${
                    reason === chip
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason Textarea */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Reason for Cancellation *</span>
              <span className="text-slate-400 text-[10px] font-normal">Mandatory for Audit Trail</span>
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer called counter, requested full release due to personal emergency..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1D68BD]/20 focus:border-[#1D68BD] transition"
            />
          </div>

          {/* Role-Specific Controls: Owner / Super Admin Refund Controls */}
          {isOwnerOrAdmin && totalPaid > 0 && (
            <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-purple-700" />
                  <span>Refund Policy Decision (Owner Only)</span>
                </span>
                <span className="text-[11px] font-extrabold text-purple-900 tabular-nums">
                  Paid: ₹{totalPaid}
                </span>
              </div>

              {/* Radio options */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRefundDecision("FULL_REFUND")}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    refundDecision === "FULL_REFUND"
                      ? "bg-white border-purple-600 shadow-2xs ring-2 ring-purple-600/20"
                      : "bg-white/70 border-purple-200/70 hover:bg-white"
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-600">Full Refund</span>
                  <span className="text-xs font-black text-emerald-600 tabular-nums mt-1">₹{totalPaid}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRefundDecision("PARTIAL_REFUND");
                    if (partialAmount <= 0) setPartialAmount(Math.round(totalPaid / 2));
                  }}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    refundDecision === "PARTIAL_REFUND"
                      ? "bg-white border-purple-600 shadow-2xs ring-2 ring-purple-600/20"
                      : "bg-white/70 border-purple-200/70 hover:bg-white"
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-600">Partial</span>
                  <span className="text-xs font-black text-purple-800 tabular-nums mt-1">
                    ₹{calculatedRefund}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRefundDecision("NO_REFUND")}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    refundDecision === "NO_REFUND"
                      ? "bg-white border-rose-500 shadow-2xs ring-2 ring-rose-500/20"
                      : "bg-white/70 border-purple-200/70 hover:bg-white"
                  }`}
                >
                  <span className="text-[10px] font-bold text-slate-600">No Refund</span>
                  <span className="text-xs font-black text-rose-600 tabular-nums mt-1">₹0 Forfeit</span>
                </button>
              </div>

              {/* Custom Partial Input */}
              {refundDecision === "PARTIAL_REFUND" && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-purple-900">
                    Custom Refund Amount (Max: ₹{totalPaid})
                  </label>
                  <div className="flex items-center rounded-xl bg-white border border-purple-300 overflow-hidden focus-within:ring-2 focus-within:ring-purple-600/20">
                    <span className="px-3 py-2 bg-purple-100/50 text-purple-800 font-bold border-r border-purple-200">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={totalPaid}
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Mark Processed Checkbox */}
              {calculatedRefund > 0 && (
                <div className="space-y-2 pt-1 border-t border-purple-200/70">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={markProcessed}
                      onChange={(e) => setMarkProcessed(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-purple-300"
                    />
                    <span className="text-xs font-semibold text-purple-950">
                      Mark refund as settled/paid immediately (Counter Cash / Instant UPI)
                    </span>
                  </label>

                  {markProcessed && (
                    <input
                      type="text"
                      value={refundRef}
                      onChange={(e) => setRefundRef(e.target.value)}
                      placeholder="Transaction / receipt note (e.g. Counter Cash, GPay TRX ID)"
                      className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Customer Notification Toggle */}
          {isOwnerOrAdmin && (
            <label className="flex items-center gap-2 cursor-pointer select-none p-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
              <input
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="w-4 h-4 rounded text-[#1D68BD] focus:ring-[#1D68BD] border-slate-300"
              />
              <span className="font-semibold text-slate-700">
                Dispatch cancellation confirmation to customer via WhatsApp &amp; SMS
              </span>
            </label>
          )}

          {/* Staff Info Banner */}
          {!isOwnerOrAdmin && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-[11px] space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-xs text-amber-950">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Duty Staff Notice</span>
              </p>
              <p className="text-amber-800 leading-relaxed">
                Submitting will send this request to the <strong>Pool Owner's Cancellation Queue</strong>. The reservation slot will remain locked until the owner approves and determines the refund decision.
              </p>
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || isCheckedIn || isCancelled}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-2xs transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
              isOwnerOrAdmin
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {submitting ? (
              <span>Processing...</span>
            ) : isOwnerOrAdmin ? (
              <>
                <XCircle className="w-4 h-4" />
                <span>Cancel Booking &amp; Release Slot</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Request to Owner</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
