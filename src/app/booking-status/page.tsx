"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getPoolDate, formatPoolDate, formatSlotTime } from "@/lib/timezone";
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
  const [todayDateStr, setTodayDateStr] = useState("");

  useEffect(() => {
    setTodayDateStr(getPoolDate());
  }, []);

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
      const res = await fetch(`/api/bookings/lookup?bookingId=${encodeURIComponent(id)}&phone=${encodeURIComponent(ph)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to find booking.");
      }
      setBookingData(data);
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
      setError("Please enter both Booking ID and Phone number.");
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
      setRescheduleMsg("Booking successfully rescheduled!");
      setShowReschedule(false);
      performLookup(bookingData.booking.id, phone);
    } catch (err: any) {
      setRescheduleMsg(`Error: ${err.message}`);
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
      setCancelMsg(data.message || "Cancellation request submitted.");
      setShowCancel(false);
      performLookup(bookingData.booking.id, phone);
    } catch (err: any) {
      setCancelMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900">Manage Your Booking</h1>
        <p className="text-sm text-slate-600">
          Enter your Booking Reference ID and registered phone number to check status, balances, or reschedule.
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleLookupSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Booking Reference ID *</label>
            <input
              type="text"
              required
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              placeholder="e.g. MAK-20261029-001"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Phone Number *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9847012345"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-2.5 rounded-lg text-sm shadow transition flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          {loading ? "Searching..." : "Find My Booking"}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {rescheduleMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <div>{rescheduleMsg}</div>
        </div>
      )}

      {cancelMsg && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>{cancelMsg}</div>
        </div>
      )}

      {/* Booking Details Card */}
      {bookingData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs uppercase font-extrabold text-ocean-600 tracking-wider">
                {bookingData.booking.type === "FAMILY" ? "Exclusive Family Booking" : "Public Swimming Session"}
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{bookingData.booking.id}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                bookingData.booking.status === "CONFIRMED"
                  ? "bg-emerald-100 text-emerald-800"
                  : bookingData.booking.status === "CANCELLED"
                  ? "bg-red-100 text-red-800"
                  : "bg-slate-100 text-slate-800"
              }`}>
                {bookingData.booking.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                bookingData.booking.paymentStatus === "PAID"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                PAYMENT: {bookingData.booking.paymentStatus}
              </span>
            </div>
          </div>

          {bookingData.booking.cancellationReason && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
              <strong>Cancellation Status:</strong> {bookingData.booking.cancellationReason}
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Customer</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{bookingData.booking.customerName}</strong>
              <span className="text-slate-500">{bookingData.booking.customerPhone}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Date & Time</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{bookingData.booking.bookingDate}</strong>
              <span className="text-slate-500 tabular-nums">{formatSlotTime(bookingData.booking.startTime)} – {formatSlotTime(bookingData.booking.endTime)}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Guests</span>
              <strong className="text-slate-900 text-sm block mt-0.5">{bookingData.booking.guestCount} Persons</strong>
              <span className="text-slate-500">{bookingData.booking.durationHours} Hours</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-slate-500 block">Counter Balance</span>
              <strong className="text-emerald-700 text-sm block mt-0.5">₹{bookingData.booking.balanceAmount}</strong>
              <span className="text-slate-500">Paid: ₹{bookingData.booking.totalPaid}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>

            {bookingData.policy.canReschedule && (
              <button
                type="button"
                onClick={() => setShowReschedule(!showReschedule)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ocean-50 hover:bg-ocean-100 text-ocean-700 text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reschedule Booking
              </button>
            )}

            {bookingData.policy.canCancel && (
              <button
                type="button"
                onClick={() => setShowCancel(!showCancel)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold"
              >
                <XCircle className="w-3.5 h-3.5" />
                Request Cancellation
              </button>
            )}
          </div>

          {/* Reschedule Drawer Form */}
          {showReschedule && (
            <form onSubmit={handleRescheduleSubmit} className="p-4 bg-ocean-50 border border-ocean-200 rounded-xl space-y-4">
              <h4 className="font-bold text-ocean-950 text-sm">Select New Date & Slot</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ocean-900 mb-1">New Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    min={todayDateStr || undefined}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-ocean-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ocean-900 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-ocean-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ocean-900 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-ocean-200 rounded text-xs"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-ocean-600 hover:bg-ocean-700 text-white font-bold px-4 py-2 rounded text-xs transition"
              >
                {loading ? "Checking & Updating..." : "Confirm Reschedule"}
              </button>
            </form>
          )}

          {/* Cancel Request Drawer Form */}
          {showCancel && (
            <form onSubmit={handleCancelSubmit} className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
              <h4 className="font-bold text-red-950 text-sm">Submit Cancellation Request</h4>
              <p className="text-xs text-red-700">
                According to pool policy, cancellations submitted more than 12 hours before start time will be reviewed by the owner for refund processing.
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-red-900 mb-1">Reason for cancellation *</label>
                <textarea
                  required
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Family medical emergency / travel change"
                  className="w-full px-2.5 py-1.5 border border-red-200 rounded text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded text-xs transition"
              >
                {loading ? "Submitting..." : "Submit Cancellation Request"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookingStatusPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 text-xs">Loading booking lookup...</div>}>
      <BookingStatusContent />
    </Suspense>
  );
}
