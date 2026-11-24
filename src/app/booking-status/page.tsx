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
  ChevronLeft,
  ArrowRight,
  Phone,
  Ticket,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import BookingPassCard from "@/components/BookingPassCard";

function BookingStatusContent() {
  const searchParams = useSearchParams();

  // Search mode: "OTP" (Mobile Number + OTP) or "REF" (Reference ID + Phone)
  const [searchMode, setSearchMode] = useState<"OTP" | "REF">("OTP");

  // Phone & OTP states
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);

  // Manual Reference ID search states
  const [bookingId, setBookingId] = useState("");
  const [phone, setPhone] = useState("");

  // Common states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verified bookings list & selected booking
  const [verifiedBookingsList, setVerifiedBookingsList] = useState<any[]>([]);
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

  // Timer countdown for resending OTP
  useEffect(() => {
    let interval: any = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Handle direct links: ?ref=...&phone=... (Bypasses OTP for seamless 1-click WhatsApp/SMS entry)
  useEffect(() => {
    const rawId =
      searchParams.get("ref") ||
      searchParams.get("id") ||
      searchParams.get("bookingId");
    const rawPhone = searchParams.get("phone");

    const idParam = rawId?.trim().replace(/[\s_]+/g, "-").toUpperCase();
    const phoneParam = rawPhone?.trim().replace(/\D/g, "");

    if (idParam) {
      setBookingId(idParam);
    }
    if (phoneParam) {
      setPhone(phoneParam);
      setMobileNumber(phoneParam);
    }
    if (idParam && phoneParam) {
      performDirectLookup(idParam, phoneParam);
    }
  }, [searchParams]);

  // Direct lookup when URL parameters are present
  const performDirectLookup = async (id: string, ph: string) => {
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
      setVerifiedBookingsList([data]);
    } catch (err: any) {
      setError(err.message || "Failed to find booking.");
      setBookingData(null);
    } finally {
      setLoading(false);
    }
  };

  // STEP 1: Send OTP to Mobile Number
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = mobileNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    setError(null);
    setDebugOtp(null);

    try {
      const res = await fetch("/api/bookings/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send verification code.");
      }

      setOtpSent(true);
      setOtpTimer(45);
      if (data.debugOtp) {
        setDebugOtp(data.debugOtp);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify OTP and Fetch Bookings
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length < 4) {
      setError("Please enter the 4-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: mobileNumber.replace(/\D/g, ""),
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid verification code.");
      }

      setVerifiedBookingsList(data.bookings || []);
      if (data.bookings && data.bookings.length === 1) {
        setBookingData(data.bookings[0]);
      } else {
        setBookingData(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify code.");
    } finally {
      setLoading(false);
    }
  };

  // Manual Reference ID submit
  const handleRefLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId.trim() || !phone.trim()) {
      setError("Please enter both Booking ID and Phone number.");
      return;
    }
    const cleanId = bookingId.trim().replace(/[\s_]+/g, "-").toUpperCase();
    const cleanPhone = phone.trim().replace(/\D/g, "");
    performDirectLookup(cleanId, cleanPhone);
  };

  // Reschedule Booking
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData) return;
    setLoading(true);
    setRescheduleMsg(null);
    try {
      const ph = bookingData.booking.customerPhone || mobileNumber;
      const res = await fetch("/api/bookings/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingData.booking.id,
          phone: ph,
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
      performDirectLookup(bookingData.booking.id, ph);
    } catch (err: any) {
      setRescheduleMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cancel Booking Request
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingData) return;
    setLoading(true);
    setCancelMsg(null);
    try {
      const ph = bookingData.booking.customerPhone || mobileNumber;
      const res = await fetch("/api/bookings/cancel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingData.booking.id,
          phone: ph,
          reason: cancelReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit cancellation request.");
      }
      setCancelMsg("Cancellation request submitted for owner review.");
      setShowCancel(false);
      performDirectLookup(bookingData.booking.id, ph);
    } catch (err: any) {
      setCancelMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset to search again
  const handleResetSearch = () => {
    setBookingData(null);
    setVerifiedBookingsList([]);
    setOtpSent(false);
    setOtpCode("");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 pt-4 sm:pt-6 selection:bg-[#1D68BD] selection:text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-5">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-2xs transition active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
            <span>Home</span>
          </Link>

          {bookingData && (
            <button
              type="button"
              onClick={() => {
                if (verifiedBookingsList.length > 1) {
                  setBookingData(null);
                } else {
                  handleResetSearch();
                }
              }}
              className="text-xs font-semibold text-[#1D68BD] hover:underline"
            >
              {verifiedBookingsList.length > 1 ? "View all bookings" : "Find another booking"}
            </button>
          )}
        </div>

        {/* Clean Header (Matching Public Booking Page) */}
        {!bookingData && verifiedBookingsList.length === 0 && (
          <div className="text-center space-y-1 pt-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Find Your Booking
            </h1>
            <p className="text-xs text-slate-500">
              Enter your registered mobile number to view your digital pass and booking details
            </p>
          </div>
        )}

        {/* =========================================================================
            LOOKUP CARD (Clean, Minimalist, Matching Step 2 in Book Page)
           ========================================================================= */}
        {!bookingData && verifiedBookingsList.length === 0 && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
            {/* Clean Segmented Tab Switcher */}
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSearchMode("OTP");
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  searchMode === "OTP"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-[#1D68BD]" />
                <span>Mobile Number</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchMode("REF");
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  searchMode === "REF"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Ticket className="w-3.5 h-3.5 text-slate-600" />
                <span>Booking ID</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* MODE 1: Mobile Number + OTP */}
            {searchMode === "OTP" && (
              <div className="space-y-4">
                {!otpSent ? (
                  /* Step 1: Phone input */
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Mobile Number
                      </label>
                      <div className="flex rounded-xl bg-slate-50 border border-slate-200 overflow-hidden focus-within:bg-white focus-within:border-[#1D68BD] focus-within:ring-2 focus-within:ring-[#1D68BD]/20 transition">
                        <span className="px-3 py-2.5 bg-slate-100 border-r border-slate-200 text-xs font-semibold text-slate-600 select-none flex items-center">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          autoFocus
                          maxLength={10}
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                          placeholder="9037818750"
                          className="w-full px-3 py-2.5 bg-transparent text-xs font-semibold text-slate-900 focus:outline-none tabular-nums"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        A 4-digit verification code will be sent to WhatsApp and SMS.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || mobileNumber.length < 10}
                      className="w-full bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Step 2: OTP input */
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px] block">Code sent to</span>
                        <strong className="text-slate-900 font-semibold tabular-nums">+91 {mobileNumber}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                          setError(null);
                        }}
                        className="text-xs font-semibold text-[#1D68BD] hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    {debugOtp && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between font-medium">
                        <span>Test Code: <strong className="font-mono text-xs">{debugOtp}</strong></span>
                        <button
                          type="button"
                          onClick={() => setOtpCode(debugOtp)}
                          className="px-2 py-0.5 rounded-lg bg-amber-200 text-amber-900 font-semibold text-[10px] hover:bg-amber-300 transition"
                        >
                          Auto Fill
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">Enter 4-Digit Code</label>
                        {otpTimer > 0 ? (
                          <span className="text-slate-400 text-[11px]">
                            Resend in <strong className="tabular-nums font-semibold text-slate-600">{otpTimer}s</strong>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={loading}
                            className="text-[11px] font-semibold text-[#1D68BD] hover:underline"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        autoFocus
                        maxLength={4}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••"
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-bold tracking-widest text-slate-900 focus:bg-white focus:border-[#1D68BD] focus:ring-2 focus:ring-[#1D68BD]/20 tabular-nums transition"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length < 4}
                      className="w-full bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify &amp; View Pass</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* MODE 2: Manual Reference ID Search */}
            {searchMode === "REF" && (
              <form onSubmit={handleRefLookupSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Booking Reference ID
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingId}
                    onChange={(e) => setBookingId(e.target.value)}
                    placeholder="e.g. MAK-20261124-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#1D68BD] focus:ring-2 focus:ring-[#1D68BD]/20 tabular-nums transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9037818750"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#1D68BD] focus:ring-2 focus:ring-[#1D68BD]/20 tabular-nums transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{loading ? "Searching..." : "Find Booking"}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* =========================================================================
            MULTIPLE BOOKINGS SELECTION LIST (If customer has > 1 booking)
           ========================================================================= */}
        {!bookingData && verifiedBookingsList.length > 1 && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Your Bookings</h2>
                <p className="text-xs text-slate-500">
                  {verifiedBookingsList.length} reservations found for +91 {mobileNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetSearch}
                className="text-xs font-semibold text-[#1D68BD] hover:underline"
              >
                Search another number
              </button>
            </div>

            <div className="space-y-2.5">
              {verifiedBookingsList.map((item, idx) => {
                const b = item.booking;
                const isFamily = b.type === "FAMILY";
                return (
                  <div
                    key={b.id || idx}
                    onClick={() => setBookingData(item)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-[#1D68BD] transition cursor-pointer bg-slate-50/50 hover:bg-white flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isFamily
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isFamily ? "Family Exclusive" : "Public"}
                        </span>
                        <span className="font-mono text-slate-500 text-xs font-semibold">{b.id}</span>
                      </div>

                      <div className="text-xs font-semibold text-slate-900">
                        {b.bookingDate} • {formatSlotTime(b.startTime)} ({b.guestCount} Swimmers)
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1D68BD] shrink-0">
                      <span>View Pass</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            SELECTED BOOKING PASS & DETAILS
           ========================================================================= */}
        {bookingData && (
          <div className="space-y-4">
            {rescheduleMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{rescheduleMsg}</span>
              </div>
            )}

            {cancelMsg && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{cancelMsg}</span>
              </div>
            )}

            {/* Official QR Booking Pass */}
            {bookingData.booking.status !== "CANCELLED" && (
              <BookingPassCard booking={bookingData.booking} showActions={true} />
            )}

            {/* Detailed Info Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs text-slate-500 block">
                    {bookingData.booking.type === "FAMILY"
                      ? "Family Exclusive Session"
                      : "Public Swimming Session"}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 tabular-nums">
                    {bookingData.booking.id}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase ${
                      bookingData.booking.status === "CONFIRMED"
                        ? "bg-emerald-100 text-emerald-800"
                        : bookingData.booking.status === "CANCELLED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {bookingData.booking.status}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase ${
                      bookingData.booking.paymentStatus === "PAID"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {bookingData.booking.paymentStatus}
                  </span>
                </div>
              </div>

              {bookingData.booking.cancellationReason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                  <strong>Cancellation Status:</strong> {bookingData.booking.cancellationReason}
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Customer</span>
                  <strong className="text-slate-900 text-xs block mt-0.5">{bookingData.booking.customerName}</strong>
                  <span className="text-slate-500 tabular-nums">{bookingData.booking.customerPhone}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Date &amp; Time</span>
                  <strong className="text-slate-900 text-xs block mt-0.5">{bookingData.booking.bookingDate}</strong>
                  <span className="text-slate-500 tabular-nums">
                    {formatSlotTime(bookingData.booking.startTime)} – {formatSlotTime(bookingData.booking.endTime)}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Guests</span>
                  <strong className="text-slate-900 text-xs block mt-0.5">{bookingData.booking.guestCount} Persons</strong>
                  <span className="text-slate-500">{bookingData.booking.durationHours} Hours</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Balance Due</span>
                  <strong className="text-emerald-700 text-sm block mt-0.5">₹{bookingData.booking.balanceAmount}</strong>
                  <span className="text-slate-500">Paid: ₹{bookingData.booking.totalPaid}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>

                {bookingData.policy?.canReschedule && (
                  <button
                    type="button"
                    onClick={() => setShowReschedule(!showReschedule)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#1D68BD] text-xs font-semibold transition active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reschedule</span>
                  </button>
                )}

                {bookingData.policy?.canCancel && (
                  <button
                    type="button"
                    onClick={() => setShowCancel(!showCancel)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#DC2626] text-xs font-semibold transition active:scale-95"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel Request</span>
                  </button>
                )}
              </div>

              {/* Reschedule Drawer Form */}
              {showReschedule && (
                <form onSubmit={handleRescheduleSubmit} className="p-4 bg-sky-50/60 border border-sky-100 rounded-xl space-y-3">
                  <h4 className="font-semibold text-[#1D68BD] text-xs">Select New Date &amp; Slot</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">New Date</label>
                      <input
                        type="date"
                        required
                        value={newDate}
                        min={todayDateStr || undefined}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        required
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">End Time</label>
                      <input
                        type="time"
                        required
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#1D68BD] hover:bg-[#155299] text-white font-semibold px-4 py-2 rounded-lg text-xs transition active:scale-95"
                  >
                    {loading ? "Updating..." : "Confirm Reschedule"}
                  </button>
                </form>
              )}

              {/* Cancel Request Drawer Form */}
              {showCancel && (
                <form onSubmit={handleCancelSubmit} className="p-4 bg-rose-50/60 border border-rose-100 rounded-xl space-y-3">
                  <h4 className="font-semibold text-[#DC2626] text-xs">Submit Cancellation Request</h4>
                  <p className="text-[11px] text-rose-700">
                    Cancellations submitted more than 12 hours before slot time are subject to owner review for refund processing.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Reason for cancellation *</label>
                    <textarea
                      required
                      rows={2}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="e.g. Travel change or emergency"
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-semibold px-4 py-2 rounded-lg text-xs transition active:scale-95"
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
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
