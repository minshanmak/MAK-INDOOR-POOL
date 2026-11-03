"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getPoolDate, formatSlotTime } from "@/lib/timezone";
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
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

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
      setCancelMsg("Cancellation request submitted for owner review.");
      setShowCancel(false);
      performLookup(bookingData.booking.id, phone);
    } catch (err: any) {
      setCancelMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F0F5FA] text-slate-800 space-y-12 sm:space-y-16 pb-20">
      {/* 1. HERO HEADER BANNER (Consistent with Mockup) */}
      <section className="relative min-h-[260px] sm:min-h-[300px] flex items-center overflow-hidden bg-[#07172C]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=2000&q=85')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07172C]/95 via-[#0A2647]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07172C] via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 z-10 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="max-w-xl space-y-3 text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-cyan-200">
              <span>M.A.K Indoor Pool</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Manage Your Booking
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100 font-normal leading-relaxed max-w-lg">
              Enter your booking reference ID and registered phone number to view live details, print receipt, or reschedule.
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-3xl p-4 text-white text-xs space-y-1.5 shadow-xl shrink-0">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <Clock className="w-4 h-4 text-cyan-300 shrink-0" />
              <span>Free Online Rescheduling</span>
            </div>
            <div className="text-[11px] text-cyan-100">
              • Up to 6 hours before slot start time
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOOKUP FORM & DETAILS (Clean Rounded 3XL Cards) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 space-y-6">
        {/* Lookup Card */}
        <form onSubmit={handleLookupSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Booking Reference ID *</label>
              <input
                type="text"
                required
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="e.g. MAK-20261029-001"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 font-mono transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Registered Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9847012345"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1D68BD] hover:bg-[#155299] text-white font-extrabold py-3 rounded-full text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? "Searching..." : "Find My Booking"}</span>
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {rescheduleMsg && (
          <div className="p-4 rounded-2xl bg-[#F0FDF8] border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>{rescheduleMsg}</div>
          </div>
        )}

        {cancelMsg && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>{cancelMsg}</div>
          </div>
        )}

        {/* Booking Details Card */}
        {bookingData && (
          <div className="bg-white rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs uppercase font-extrabold text-[#1D68BD] tracking-wider block">
                  {bookingData.booking.type === "FAMILY" ? "Exclusive Family Booking" : "Public Swimming Session"}
                </span>
                <h2 className="text-2xl font-black text-slate-900 font-mono mt-0.5">{bookingData.booking.id}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  bookingData.booking.status === "CONFIRMED"
                    ? "bg-[#DCFCE7] text-[#15803D]"
                    : bookingData.booking.status === "CANCELLED"
                    ? "bg-[#FEE2E2] text-[#DC2626]"
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {bookingData.booking.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  bookingData.booking.paymentStatus === "PAID"
                    ? "bg-[#DCFCE7] text-[#15803D]"
                    : "bg-[#FEF3C7] text-[#B45309]"
                }`}>
                  Payment: {bookingData.booking.paymentStatus}
                </span>
              </div>
            </div>

            {bookingData.booking.cancellationReason && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900">
                <strong>Cancellation Status:</strong> {bookingData.booking.cancellationReason}
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Customer</span>
                <strong className="text-slate-900 text-xs block mt-1">{bookingData.booking.customerName}</strong>
                <span className="text-slate-500">{bookingData.booking.customerPhone}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Date &amp; Time</span>
                <strong className="text-slate-900 text-xs block mt-1">{bookingData.booking.bookingDate}</strong>
                <span className="text-slate-500 tabular-nums">
                  {formatSlotTime(bookingData.booking.startTime)} – {formatSlotTime(bookingData.booking.endTime)}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Guests</span>
                <strong className="text-slate-900 text-xs block mt-1">{bookingData.booking.guestCount} Persons</strong>
                <span className="text-slate-500">{bookingData.booking.durationHours} Hours</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">Counter Balance</span>
                <strong className="text-emerald-700 text-sm block mt-1">₹{bookingData.booking.balanceAmount}</strong>
                <span className="text-slate-500">Paid: ₹{bookingData.booking.totalPaid}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>

              {bookingData.policy.canReschedule && (
                <button
                  type="button"
                  onClick={() => setShowReschedule(!showReschedule)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-sky-50 hover:bg-sky-100 text-[#1D68BD] text-xs font-bold transition active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reschedule Booking</span>
                </button>
              )}

              {bookingData.policy.canCancel && (
                <button
                  type="button"
                  onClick={() => setShowCancel(!showCancel)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-[#DC2626] text-xs font-bold transition active:scale-95"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Request Cancellation</span>
                </button>
              )}
            </div>

            {/* Reschedule Drawer Form */}
            {showReschedule && (
              <form onSubmit={handleRescheduleSubmit} className="p-5 bg-sky-50/70 border border-sky-100 rounded-2xl space-y-4">
                <h4 className="font-bold text-[#1D68BD] text-xs uppercase tracking-wider">Select New Date &amp; Slot</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">New Date</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      min={todayDateStr || undefined}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#1D68BD] hover:bg-[#155299] text-white font-bold px-5 py-2.5 rounded-full text-xs transition active:scale-95"
                >
                  {loading ? "Checking & Updating..." : "Confirm Reschedule"}
                </button>
              </form>
            )}

            {/* Cancel Request Drawer Form */}
            {showCancel && (
              <form onSubmit={handleCancelSubmit} className="p-5 bg-rose-50/70 border border-rose-100 rounded-2xl space-y-3">
                <h4 className="font-bold text-[#DC2626] text-xs uppercase tracking-wider">Submit Cancellation Request</h4>
                <p className="text-xs text-rose-700">
                  According to pool policy, cancellations submitted more than 12 hours before start time will be reviewed by the owner for refund processing.
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Reason for cancellation *</label>
                  <textarea
                    required
                    rows={2}
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="e.g. Family medical emergency / travel change"
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold px-5 py-2.5 rounded-full text-xs transition active:scale-95"
                >
                  {loading ? "Submitting..." : "Submit Cancellation Request"}
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      {/* 3. "READY TO SWIM?" CTA BANNER (Exact Match) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#0E5296] via-[#1A6BA8] to-[#0A3D73] rounded-3xl p-6 sm:p-9 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Ready to Swim?
            </h2>
            <p className="text-cyan-100 text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed">
              Book your slot now and experience a clean, modern and family-friendly indoor pool.
            </p>
          </div>

          <Link
            href="/book"
            className="bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-black px-7 py-3 rounded-full text-xs sm:text-sm shadow-lg transition inline-flex items-center gap-2 shrink-0"
          >
            <span>Book Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
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
