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
  ArrowRight,
  Phone,
  KeyRound,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Ticket,
  Lock,
  MessageSquare,
  QrCode,
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
    <div className="min-h-screen bg-[#F4F7FB] text-slate-800 space-y-10 sm:space-y-12 pb-24">
      {/* 1. HERO HEADER BANNER */}
      <section className="relative min-h-[280px] sm:min-h-[320px] flex items-center justify-center overflow-hidden bg-[#061426]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=2000&q=85')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#061426]/90 via-[#0A2647]/80 to-[#F4F7FB]" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center z-10 space-y-3 pt-6 pb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-cyan-200">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>M.A.K Indoor Pool &bull; Digital Entry Pass</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Find Your Swimming Pass
          </h1>

          <p className="text-xs sm:text-sm text-cyan-100/90 font-normal max-w-lg mx-auto leading-relaxed">
            Enter your mobile number to view active reservations, download scannable QR passes, or manage your time slot.
          </p>
        </div>
      </section>

      {/* 2. MAIN CONTENT AREA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-20 space-y-6">
        {/* =========================================================================
            SEARCH CARD (Focused, Centered, Apple / Stripe Style)
           ========================================================================= */}
        {!bookingData && verifiedBookingsList.length === 0 && (
          <div className="max-w-md mx-auto bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(10,38,71,0.1)] border border-white/80 space-y-5 animate-in fade-in duration-200">
            {/* Segmented Tab Switcher */}
            <div className="flex bg-slate-100/90 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setSearchMode("OTP");
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  searchMode === "OTP"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-[#1D68BD]" />
                <span>Mobile OTP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchMode("REF");
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  searchMode === "REF"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Ticket className="w-3.5 h-3.5 text-purple-600" />
                <span>Booking ID</span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-start gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* MODE 1: Mobile Number + OTP Verification */}
            {searchMode === "OTP" && (
              <div className="space-y-4">
                {!otpSent ? (
                  /* Step 1: Mobile Number Input */
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Enter Registered Mobile Number
                      </label>

                      <div className="flex items-center rounded-2xl bg-slate-50 border border-slate-200/90 focus-within:bg-white focus-within:border-[#1D68BD] focus-within:ring-4 focus-within:ring-blue-500/10 transition overflow-hidden">
                        <div className="px-3.5 py-3 bg-slate-100/90 border-r border-slate-200/80 text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0 select-none">
                          <span className="text-sm">🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          required
                          autoFocus
                          maxLength={10}
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                          placeholder="90378 18750"
                          className="w-full px-3.5 py-3 bg-transparent text-sm font-bold text-slate-900 focus:outline-none tabular-nums tracking-wider placeholder:text-slate-400 placeholder:font-medium placeholder:tracking-normal"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        We will send a 4-digit code to your WhatsApp and SMS.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || mobileNumber.length < 10}
                      className="w-full bg-[#1D68BD] hover:bg-[#155299] active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending Verification Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Get Verification Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Step 2: 4-Digit OTP Entry */
                  <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                    <div className="p-3 bg-blue-50/80 border border-blue-100 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-bold block">Code sent to</span>
                        <strong className="text-slate-900 font-bold tabular-nums text-xs sm:text-sm">
                          +91 {mobileNumber}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                          setError(null);
                        }}
                        className="text-xs font-bold text-[#1D68BD] hover:underline"
                      >
                        Change
                      </button>
                    </div>

                    {debugOtp && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between font-medium">
                        <span>Test Code: <strong className="font-mono text-sm">{debugOtp}</strong></span>
                        <button
                          type="button"
                          onClick={() => setOtpCode(debugOtp)}
                          className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-[10px] hover:bg-amber-300 transition"
                        >
                          Auto Fill
                        </button>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Enter 4-Digit Code</label>
                        {otpTimer > 0 ? (
                          <span className="text-slate-400 text-[11px]">
                            Resend in <strong className="tabular-nums font-bold text-slate-600">{otpTimer}s</strong>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={loading}
                            className="text-[11px] font-bold text-[#1D68BD] hover:underline"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          autoFocus
                          maxLength={4}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="• • • •"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-center text-xl font-bold tracking-widest text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#1D68BD] tabular-nums transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length < 4}
                      className="w-full bg-[#1D68BD] hover:bg-[#155299] active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify &amp; View Pass</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* MODE 2: Manual Reference ID Lookup */}
            {searchMode === "REF" && (
              <form onSubmit={handleRefLookupSubmit} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Booking Reference ID
                    </label>
                    <div className="relative">
                      <Ticket className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value)}
                        placeholder="MAK-20261124-001"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#1D68BD] tabular-nums font-semibold transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="90378 18750"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-[#1D68BD] tabular-nums font-semibold transition"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1D68BD] hover:bg-[#155299] active:scale-[0.98] text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>{loading ? "Searching..." : "Find My Pass"}</span>
                </button>
              </form>
            )}

            {/* Micro Trust Strip */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                WhatsApp OTP
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                Digital QR Pass
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                Secure
              </span>
            </div>
          </div>
        )}

        {/* =========================================================================
            MULTIPLE BOOKINGS SELECTION LIST (If customer has > 1 booking)
           ========================================================================= */}
        {!bookingData && verifiedBookingsList.length > 1 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Your Pool Reservations</h3>
                <p className="text-xs text-slate-500">
                  Found <strong className="text-slate-900">{verifiedBookingsList.length}</strong> bookings for +91 {mobileNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetSearch}
                className="text-xs font-semibold text-[#1D68BD] hover:underline"
              >
                ← Search Another Number
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {verifiedBookingsList.map((item, idx) => {
                const b = item.booking;
                const isFamily = b.type === "FAMILY";
                return (
                  <div
                    key={b.id || idx}
                    onClick={() => setBookingData(item)}
                    className="p-4 rounded-2xl border border-slate-200/80 hover:border-[#1D68BD] hover:shadow-md transition cursor-pointer bg-slate-50/50 hover:bg-white space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          isFamily
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isFamily ? "Family Exclusive" : "Public Swimming"}
                      </span>

                      <span className="font-mono text-slate-500 text-[11px] font-semibold">{b.id}</span>
                    </div>

                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {b.bookingDate} &bull; {formatSlotTime(b.startTime)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {b.guestCount} {b.guestCount === 1 ? "Swimmer" : "Swimmers"} &bull; {b.durationHours} Hr
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <span className="font-bold text-emerald-700">
                        Paid: ₹{b.totalPaid} {b.balanceAmount > 0 && `(Bal: ₹${b.balanceAmount})`}
                      </span>

                      <span className="text-[#1D68BD] font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition">
                        <span>Open Pass</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
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
          <div className="space-y-6 animate-in fade-in">
            {/* Top Navigation Bar when viewing pass */}
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-white shadow-xs text-xs">
              <button
                type="button"
                onClick={() => {
                  if (verifiedBookingsList.length > 1) {
                    setBookingData(null);
                  } else {
                    handleResetSearch();
                  }
                }}
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-bold transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{verifiedBookingsList.length > 1 ? "Back to All Bookings" : "Check Another Number"}</span>
              </button>

              <span className="text-slate-400 font-medium text-[11px]">
                Pass Reference: <strong className="text-slate-800 font-mono">{bookingData.booking.id}</strong>
              </span>
            </div>

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

            {/* Official QR Booking Pass */}
            {bookingData.booking.status !== "CANCELLED" && (
              <div className="pb-1">
                <BookingPassCard booking={bookingData.booking} showActions={true} />
              </div>
            )}

            {/* Detailed Info Card */}
            <div className="bg-white rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-semibold text-[#1D68BD] block">
                    {bookingData.booking.type === "FAMILY"
                      ? "Exclusive Family Session"
                      : "Public Swimming Session"}
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums mt-0.5">
                    {bookingData.booking.id}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      bookingData.booking.status === "CONFIRMED"
                        ? "bg-[#DCFCE7] text-[#15803D]"
                        : bookingData.booking.status === "CANCELLED"
                        ? "bg-[#FEE2E2] text-[#DC2626]"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {bookingData.booking.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      bookingData.booking.paymentStatus === "PAID"
                        ? "bg-[#DCFCE7] text-[#15803D]"
                        : "bg-[#FEF3C7] text-[#B45309]"
                    }`}
                  >
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
                  <span className="text-slate-500 tabular-nums">{bookingData.booking.customerPhone}</span>
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

                {bookingData.policy?.canReschedule && (
                  <button
                    type="button"
                    onClick={() => setShowReschedule(!showReschedule)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-sky-50 hover:bg-sky-100 text-[#1D68BD] text-xs font-bold transition active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reschedule Booking</span>
                  </button>
                )}

                {bookingData.policy?.canCancel && (
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
          </div>
        )}
      </section>

      {/* 3. "READY TO SWIM?" CTA BANNER */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-[#0077B6] via-[#0096C7] to-[#00B4D8] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
              Ready to Swim?
            </h2>
            <p className="text-cyan-100 text-xs sm:text-sm mt-1 max-w-xl font-normal leading-relaxed">
              Book your slot now and enjoy a clean and premium indoor pool experience.
            </p>
          </div>

          <Link
            href="/book"
            className="bg-white hover:bg-slate-100 active:scale-95 text-slate-900 font-bold px-6 py-2.5 rounded-full text-xs sm:text-sm shadow-md transition inline-flex items-center gap-2 shrink-0"
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
