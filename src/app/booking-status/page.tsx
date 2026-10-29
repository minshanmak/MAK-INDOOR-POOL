"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Printer,
  RefreshCw,
  XCircle,
  ShieldCheck,
  CreditCard,
  Users,
  ArrowRight,
  Info,
} from "lucide-react";

function BookingStatusContent() {
  const searchParams = useSearchParams();
  const [bookingId, setBookingId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);

  // Reschedule Form State
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("17:00");
  const [newEndTime, setNewEndTime] = useState("19:00");
  const [rescheduleMsg, setRescheduleMsg] = useState<string | null>(null);

  // Cancellation Form State
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);

  useEffect(() => {
    const idParam = searchParams.get("id");
    const phoneParam = searchParams.get("phone");
    if (idParam && phoneParam) {
      setBookingId(idParam);
      setPhone(phoneParam);
      performLookup(idParam, phoneParam);
    }
  }, [searchParams]);

  const performLookup = async (id: string, ph: string) => {
    setLoading(true);
    setError(null);
    setRescheduleMsg(null);
    setCancelMsg(null);
    try {
      const res = await fetch(
        `/api/bookings/lookup?bookingId=${encodeURIComponent(id)}&phone=${encodeURIComponent(ph)}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to find booking.");
      }
      setBookingData(data);
      if (data.booking) {
        setNewDate(data.booking.bookingDate);
        setNewStartTime(data.booking.startTime);
        setNewEndTime(data.booking.endTime);
      }
    } catch (err: any) {
      setError(err.message || "Failed to find booking.");
      setBookingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId.trim() || !phone.trim()) {
      setError("Please enter both your Booking Reference ID and registered phone number.");
      return;
    }
    performLookup(bookingId.trim(), phone.trim());
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRescheduleMsg(null);
    try {
      const res = await fetch("/api/bookings/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingData.booking.id,
          phone,
          newDate,
          newStartTime,
          newEndTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reschedule booking.");
      }
      setRescheduleMsg("Booking successfully rescheduled to the new date and time!");
      setShowReschedule(false);
      performLookup(bookingData.booking.id, phone);
    } catch (err: any) {
      setRescheduleMsg(`Reschedule Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCancelMsg(null);
    try {
      const res = await fetch("/api/bookings/cancel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingData.booking.id,
          phone,
          reason: cancelReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit cancellation request.");
      }
      setCancelMsg(
        data.message ||
        "Cancellation request registered. An authorized manager will review and approve release of the slot."
      );
      setShowCancel(false);
      performLookup(bookingData.booking.id, phone);
    } catch (err: any) {
      setCancelMsg(`Cancellation Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      {/* Editorial Header */}
      <div className="border-b border-slate-200 pb-5 max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold mb-2">
          <span>Self-Service Portal</span>
          <span className="text-slate-400">•</span>
          <span>Security IDOR Protected</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Lookup & Manage Your Reservation
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
          Verify your booking details, track counter balance due, reprint digital receipts, or submit rescheduling and cancellation requests.
        </p>
      </div>

      {/* Lookup Form */}
      <form
        onSubmit={handleLookupSubmit}
        className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Booking Reference ID *
            </label>
            <input
              type="text"
              required
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="e.g. MAK-20261029-001"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-cyan-500 text-slate-900 uppercase"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Registered Mobile Number *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9847012345"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{loading ? "Verifying with Authoritative Records..." : "Lookup Booking Details"}</span>
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {rescheduleMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <div className="leading-relaxed">{rescheduleMsg}</div>
        </div>
      )}

      {cancelMsg && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="leading-relaxed">{cancelMsg}</div>
        </div>
      )}

      {/* Booking Record Display */}
      {bookingData && bookingData.booking && (
        <div
          id="booking-receipt"
          className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6"
        >
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-5">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-700 block">
                {bookingData.booking.type === "FAMILY"
                  ? "EXCLUSIVE FAMILY SESSION (100% PRIVATE)"
                  : "PUBLIC SWIMMING SESSION"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
                {bookingData.booking.id}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${bookingData.booking.status === "CONFIRMED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : bookingData.booking.status === "CANCELLED"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
              >
                {bookingData.booking.status}
              </span>

              <span
                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${bookingData.booking.paymentStatus === "PAID"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
              >
                PAYMENT: {bookingData.booking.paymentStatus}
              </span>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-2.5 py-1 rounded text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition flex items-center gap-1"
              >
                <Printer className="w-3 h-3" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>

          {bookingData.booking.cancellationReason && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
              <strong>Cancellation Status:</strong> {bookingData.booking.cancellationReason}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Customer Name
              </span>
              <strong className="text-slate-900 text-xs block mt-0.5 truncate">
                {bookingData.booking.customerName}
              </strong>
              <span className="text-slate-500 font-mono text-[11px]">
                {bookingData.booking.customerPhone}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Session Date & Time
              </span>
              <strong className="text-slate-900 text-xs block mt-0.5 tabular-nums">
                {bookingData.booking.bookingDate}
              </strong>
              <span className="text-slate-500 font-medium tabular-nums text-[11px]">
                {bookingData.booking.startTime} – {bookingData.booking.endTime}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Party Size
              </span>
              <strong className="text-slate-900 text-xs block mt-0.5">
                {bookingData.booking.guestCount} Persons
              </strong>
              <span className="text-slate-500 text-[11px]">
                {bookingData.booking.type === "FAMILY" && bookingData.booking.guestCount > 12
                  ? `${bookingData.booking.guestCount - 12} extra guests included`
                  : "Base party allowance"}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Remaining Balance Due
              </span>
              <strong className="text-amber-700 text-base font-black block mt-0.5 tabular-nums">
                ₹{bookingData.booking.balanceAmount}
              </strong>
              <span className="text-slate-500 text-[11px]">Pay Cash/UPI at counter</span>
            </div>
          </div>

          {/* Authoritative Financial Breakdown Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
              Billing Ledger & Advance Payments
            </span>
            <div className="flex justify-between text-slate-600">
              <span>Total Calculated Booking Amount:</span>
              <span className="font-bold text-slate-900 tabular-nums">
                ₹{bookingData.booking.totalAmount}
              </span>
            </div>
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Verified Advance Paid Online:</span>
              <span className="tabular-nums">-₹{bookingData.booking.totalPaid}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
              <span>Remaining Balance to Collect at Counter:</span>
              <span className="text-amber-700 tabular-nums">
                ₹{bookingData.booking.balanceAmount}
              </span>
            </div>
          </div>

          {/* Interactive Self-Service Controls */}
          {bookingData.booking.status === "CONFIRMED" && (
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReschedule(!showReschedule);
                  setShowCancel(false);
                }}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-700" />
                <span>Reschedule Booking (Cutoff: 6h)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCancel(!showCancel);
                  setShowReschedule(false);
                }}
                className="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Request Cancellation (Cutoff: 12h)</span>
              </button>
            </div>
          )}

          {/* Reschedule Form Panel */}
          {showReschedule && (
            <form
              onSubmit={handleRescheduleSubmit}
              className="p-5 bg-cyan-50/40 border border-cyan-200 rounded-lg space-y-4 text-xs"
            >
              <h3 className="font-bold text-cyan-950 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-cyan-700" />
                Select New Rescheduled Session Date & Time
              </h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                You may reschedule online without fee as long as the new slot is available and requested at least 6 hours prior to your scheduled start.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">New Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">New Start Time</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">New End Time</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-cyan-700 hover:bg-cyan-600 text-white font-bold px-4 py-2 rounded text-xs transition"
                >
                  {loading ? "Checking Conflicts..." : "Confirm Reschedule"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReschedule(false)}
                  className="text-slate-500 hover:text-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Cancellation Form Panel */}
          {showCancel && (
            <form
              onSubmit={handleCancelSubmit}
              className="p-5 bg-rose-50/50 border border-rose-200 rounded-lg space-y-4 text-xs"
            >
              <h3 className="font-bold text-rose-950 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                Submit Cancellation Request
              </h3>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                <strong>Policy Notice:</strong> Cancellation requests must be submitted at least 12 hours before slot start time. Refunds are decided and approved exclusively by the Pool Owner and are returned to the original payment source in 3 to 5 banking days. Submitting this form alerts the manager to review and release the slot.
              </p>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Reason for Cancellation *
                </label>
                <textarea
                  rows={2}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Family emergency, travel plans changed..."
                  className="w-full px-3 py-2 border border-slate-300 rounded text-xs text-slate-900 bg-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-rose-700 hover:bg-rose-600 text-white font-bold px-4 py-2 rounded text-xs transition"
                >
                  {loading ? "Submitting Request..." : "Submit Cancellation Request"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancel(false)}
                  className="text-slate-500 hover:text-slate-700 text-xs font-semibold"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookingStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-xs text-slate-400">
          Loading booking status portal...
        </div>
      }
    >
      <BookingStatusContent />
    </Suspense>
  );
}
