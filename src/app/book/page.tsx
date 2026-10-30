"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Printer,
  ChevronRight,
  Lock,
  ArrowLeft,
  ShieldCheck,
  Copy,
  Check,
  MapPin,
  Phone,
  HelpCircle,
  Info,
  RotateCcw,
} from "lucide-react";

export default function BookNowPage() {
  const [bookingType, setBookingType] = useState<"PUBLIC" | "FAMILY">("FAMILY");
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("16:00");
  const [durationHours, setDurationHours] = useState<number>(1);
  const [guestCount, setGuestCount] = useState<number>(8);

  // Customer Contact Info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Step Tracker: 1 = Form & Summary, 2 = Checkout & Hold Timer, 3 = Receipt
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server-Authoritative State
  const [availResult, setAvailResult] = useState<any>(null);
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  useEffect(() => {
    if (bookingType === "PUBLIC") {
      setStartTime("09:00");
      setGuestCount(2);
      setDurationHours(1);
    } else {
      setStartTime("16:00");
      setGuestCount(8);
      setDurationHours(1);
    }
  }, [bookingType]);

  // Real-time ticking countdown for the 15-minute slot hold
  useEffect(() => {
    if (!holdExpiresAt || step !== 2) {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(holdExpiresAt).getTime();
      const diffSecs = Math.max(0, Math.floor((expiry - now) / 1000));
      setSecondsRemaining(diffSecs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt, step]);

  const getEndTime = (start: string, duration: number): string => {
    const [h, m] = start.split(":").map(Number);
    const totalMinutes = h * 60 + (m || 0) + duration * 60;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  const endTime = getEndTime(startTime, durationHours);

  // Authoritative availability & pricing query
  useEffect(() => {
    if (!date || !startTime || !endTime) return;
    let isCancelled = false;

    const fetchAvail = async () => {
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          date,
          startTime,
          endTime,
          type: bookingType,
          guests: String(guestCount),
        });
        const res = await fetch(`/api/availability?${queryParams.toString()}`);
        const data = await res.json();
        if (!isCancelled) {
          if (!res.ok) {
            setError(data.error || "Unable to check availability.");
            setAvailResult(null);
          } else {
            setAvailResult(data);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Network error checking availability.");
        }
      }
    };

    fetchAvail();
    return () => {
      isCancelled = true;
    };
  }, [date, startTime, endTime, bookingType, guestCount]);

  const formatTimeSlot = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, "0")}:${String(m || 0).padStart(2, "0")} ${period}`;
  };

  // Available Slot Choices
  const publicSlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"
  ];
  const familySlots = [
    "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
  ];
  const activeSlots = bookingType === "PUBLIC" ? publicSlots : familySlots;

  // Step 1 to Step 2: Request 15-Minute Slot Hold
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Please provide your Name and 10-digit Mobile Number.");
      return;
    }
    if (customerPhone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit Indian phone number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingDate: date,
          startTime,
          endTime,
          bookingType,
          guestCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to hold slot. It may have just been booked.");
      }

      setHoldToken(data.holdToken);
      setHoldExpiresAt(new Date(data.expiresAt));
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Could not reserve slot.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm Sandbox Payment & Book
  const handleCompletePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const paymentAmount =
        bookingType === "FAMILY" ? 750 : (availResult?.pricing?.totalAmount || 150);

      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdToken,
          customerName,
          customerPhone,
          customerEmail,
          bookingType,
          bookingDate: date,
          startTime,
          endTime,
          guestCount,
          notes,
          isStaffCreated: false,
          paymentMethod: "GATEWAY",
          initialAmount: paymentAmount,
          transactionRef: `TRX-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm booking.");
      }

      setConfirmedBooking(data.booking);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Payment verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const formatTimer = (totalSeconds: number | null) => {
    if (totalSeconds === null) return "15:00";
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Pricing calculations
  const isFamily = bookingType === "FAMILY";
  const baseRate = isFamily ? 1500 : 150;
  const extraGuests = isFamily ? Math.max(0, guestCount - 12) : 0;
  const extraGuestFee = extraGuests * 100 * durationHours;
  const baseTotal = isFamily ? 1500 * durationHours : 150 * guestCount * durationHours;
  const computedTotal = availResult?.pricing?.totalPrice ?? (baseTotal + extraGuestFee);
  const requiredAdvance = isFamily ? (availResult?.pricing?.advanceRequired ?? 750) : computedTotal;
  const remainingArrivalBalance = computedTotal - requiredAdvance;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Modern Step Progress Indicator */}
        <div className="max-w-md mx-auto flex items-center justify-between text-xs font-semibold text-slate-500">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-[#00838F] font-bold" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${step >= 1 ? "bg-[#00838F] text-white" : "bg-slate-200 text-slate-600"}`}>
              1
            </span>
            <span>Configure</span>
          </div>
          <span className="h-0.5 w-12 bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-[#00838F] font-bold" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${step >= 2 ? "bg-[#00838F] text-white" : "bg-slate-200 text-slate-600"}`}>
              2
            </span>
            <span>Secure Hold</span>
          </div>
          <span className="h-0.5 w-12 bg-slate-200" />
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono ${step >= 3 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"}`}>
              3
            </span>
            <span>Receipt</span>
          </div>
        </div>

        {/* Title & Subtitle Matching Reference */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            Book Your Swimming Slot
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Choose between daytime public swimming or an exclusive evening family booking.
          </p>
        </div>

        {/* Top Segmented Toggle Matching Reference Image */}
        {step === 1 && (
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 bg-slate-100/90 border border-slate-200/90 rounded-2xl shadow-xs">
              <button
                type="button"
                onClick={() => setBookingType("PUBLIC")}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                  bookingType === "PUBLIC"
                    ? "bg-[#00838F] text-white shadow-xs scale-[1.02]"
                    : "text-slate-600 hover:text-[#00838F]"
                }`}
              >
                Public Swimming
              </button>
              <button
                type="button"
                onClick={() => setBookingType("FAMILY")}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                  bookingType === "FAMILY"
                    ? "bg-[#00838F] text-white shadow-xs scale-[1.02]"
                    : "text-slate-600 hover:text-[#00838F]"
                }`}
              >
                Family Exclusive Booking
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* STEP 1: Two-Column Form & Summary Matching Reference Image */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              {/* 1. Select Date */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#0A192F]">
                  1. Select Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00838F]"
                  />
                </div>
              </div>

              {/* 2. Select Time */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#0A192F]">
                    2. Select Time
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {isFamily ? "Evening Exclusive (16:00 – 23:00)" : "Daytime Public (09:00 – 16:00)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {activeSlots.map((slot) => {
                    const isSelected = startTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setStartTime(slot)}
                        className={`p-2.5 rounded-lg border text-center transition ${
                          isSelected
                            ? "border-[#00838F] bg-[#00838F]/5 text-[#00838F] ring-1 ring-[#00838F]"
                            : "border-slate-200 bg-white hover:border-[#00838F]/40 text-slate-800"
                        }`}
                      >
                        <div className="font-bold text-xs font-mono">{formatTimeSlot(slot)}</div>
                        <div
                          className={`text-[10px] font-semibold mt-0.5 ${
                            isSelected
                              ? "text-[#00838F] font-bold"
                              : "text-emerald-700"
                          }`}
                        >
                          {isSelected ? "Selected" : "Available"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Number of Guests */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#0A192F]">
                  3. Number of Guests
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
                    >
                      –
                    </button>
                    <span className="w-12 text-center font-bold text-sm text-[#0A192F] font-mono">
                      {guestCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.min(isFamily ? 30 : 25, guestCount + 1))}
                      className="w-8 h-8 rounded-md bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-slate-500">
                    {isFamily
                      ? "Up to 12 people included in base price"
                      : "₹150 per person per hour (25 max cap)"}
                  </span>
                </div>
              </div>

              {/* 4. Duration */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#0A192F]">
                  4. Duration
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full sm:w-64 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00838F]"
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                </select>
              </div>

              {/* 5. Contact Details */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-[#0A192F]">
                  Contact &amp; Swimmer Details
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="98470XXXXX"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Information Info Box Matching Reference */}
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2 text-[#00838F] font-bold">
                  <Info className="w-4 h-4" />
                  <span>Booking Information</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>Family exclusive booking allows up to 12 people for ₹1,500 per hour.</li>
                  <li>Additional guests are charged at ₹100 per person per hour above 12.</li>
                  <li>An advance payment of ₹750 is required to confirm your booking.</li>
                  <li>The remaining amount is to be paid at the facility on arrival.</li>
                </ul>
              </div>
            </div>

            {/* Right Column: Booking Summary Card (5 cols) Matching Reference */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5 sticky top-24">
              <h2 className="text-sm font-bold text-[#0A192F] tracking-tight pb-3 border-b border-slate-100">
                Booking Summary
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Booking Type</span>
                  <span className="font-bold text-slate-900">
                    {isFamily ? "Family Exclusive" : "Public Swimming"}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Date</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {date}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Time</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatTimeSlot(startTime)} – {formatTimeSlot(endTime)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Duration</span>
                  <span className="font-semibold text-slate-900">{durationHours} Hour{durationHours > 1 ? "s" : ""}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Number of Guests</span>
                  <span className="font-semibold text-slate-900">
                    {guestCount} {isFamily && guestCount <= 12 ? "(up to 12 included)" : ""}
                  </span>
                </div>
              </div>

              {/* Price Details Divider */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <span className="block font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Price Details
                </span>

                <div className="flex justify-between text-slate-600">
                  <span>Base Price ({durationHours} hour{durationHours > 1 ? "s" : ""})</span>
                  <span className="font-mono text-slate-900">₹{baseTotal}</span>
                </div>

                {isFamily && (
                  <div className="flex justify-between text-slate-600">
                    <span>Additional Guests ({extraGuests})</span>
                    <span className="font-mono text-slate-900">₹{extraGuestFee}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-sm text-[#0A192F] pt-2 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span className="font-mono">₹{computedTotal}</span>
                </div>
              </div>

              {/* Soft Amber Card: Advance Payment Highlight Matching Reference */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 text-xs text-amber-950">
                <div className="font-bold flex items-center justify-between">
                  <span>Advance Payment (Required)</span>
                  <span className="text-base font-black font-mono">₹{requiredAdvance}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Pay ₹{requiredAdvance} now to confirm your booking. Remaining ₹{remainingArrivalBalance} to be paid on arrival.
                </p>
              </div>

              {/* CTA Button Matching Reference */}
              <button
                type="button"
                disabled={loading}
                onClick={handleProceedToPayment}
                className="w-full bg-[#00838F] hover:bg-[#007079] text-white font-bold py-3 rounded-lg text-xs shadow-xs transition duration-150 flex items-center justify-center gap-2"
              >
                {loading ? "Holding Slot..." : "Proceed to Payment"}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-tight">
                You will be redirected to a secure payment page.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: 15-Minute Slot Hold Checkout & Payment Simulation */}
        {step === 2 && (
          <div className="max-w-xl mx-auto bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#00838F] bg-teal-50 px-2.5 py-1 rounded">
                SLOT TEMPORARILY LOCKED
              </span>
              <h2 className="text-xl font-black text-[#0A192F]">Complete Advance Payment</h2>
              <p className="text-xs text-slate-500">
                Your selected slot is reserved for 15 minutes while you complete checkout.
              </p>
            </div>

            {/* Countdown Clock */}
            <div className="p-4 rounded-xl bg-slate-900 text-white text-center space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                Holding Time Remaining
              </span>
              <div className="text-3xl font-black font-mono tracking-widest text-cyan-400">
                {formatTimer(secondsRemaining)}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Slot auto-releases if payment is not confirmed within 15:00
              </span>
            </div>

            {/* Payment Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span className="font-bold text-slate-900">{customerName} ({customerPhone})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Session:</span>
                <span className="font-mono text-slate-900">{date} • {formatTimeSlot(startTime)} – {formatTimeSlot(endTime)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Required Advance:</span>
                <span className="font-bold text-emerald-700 text-sm font-mono">₹{requiredAdvance}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span>Counter Balance Due on Arrival:</span>
                <span className="font-mono text-slate-900">₹{remainingArrivalBalance}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleCompletePayment}
                className="w-full bg-[#00838F] hover:bg-[#007079] text-white font-bold py-3.5 rounded-lg text-xs shadow-xs transition"
              >
                {loading ? "Confirming Gateway Transaction..." : `Pay ₹${requiredAdvance} & Confirm Booking`}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                &larr; Back to Slot Selection
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Printable Booking Confirmation & Receipt */}
        {step === 3 && confirmedBooking && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h2 className="text-xl font-black text-[#0A192F]">Booking Confirmed!</h2>
              <p className="text-xs text-slate-500">
                Your pool reservation has been authoritatively locked in the system.
              </p>
            </div>

            {/* Booking Code Banner */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-cyan-400 tracking-wider block">
                  Booking Reference ID
                </span>
                <span className="text-xl font-mono font-black">{confirmedBooking.id}</span>
              </div>
              <button
                onClick={() => handleCopyCode(confirmedBooking.id)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Receipt Summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Customer:</span>
                <span className="font-bold text-slate-900">{confirmedBooking.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Session Date &amp; Time:</span>
                <span className="font-mono text-slate-900">{confirmedBooking.bookingDate} ({formatTimeSlot(confirmedBooking.startTime)} – {formatTimeSlot(confirmedBooking.endTime)})</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Paid Online Advance:</span>
                <span className="font-bold text-emerald-700 font-mono">₹{confirmedBooking.totalPaid}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span>Balance Due at Counter:</span>
                <span className="font-bold text-slate-900 font-mono">₹{confirmedBooking.balanceAmount}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Receipt</span>
              </button>
              <Link
                href={`/booking-status?ref=${confirmedBooking.id}&phone=${customerPhone}`}
                className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold py-2.5 rounded-lg text-xs text-center transition"
              >
                Manage Booking Self-Service
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
