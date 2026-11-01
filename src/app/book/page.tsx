"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
  Sparkles,
} from "lucide-react";
import { getPoolDate, getPoolHour } from "@/lib/timezone";

function BookingContent() {
  const searchParams = useSearchParams();
  const paramType = searchParams.get("type")?.toUpperCase();
  const initialType: "PUBLIC" | "FAMILY" = paramType === "PUBLIC" ? "PUBLIC" : "FAMILY";

  const [bookingType, setBookingType] = useState<"PUBLIC" | "FAMILY">(initialType);
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

  // Pool Timezone helper values (Asia/Kolkata)
  const todayIST = useMemo(() => getPoolDate(), []);
  const tomorrowIST = useMemo(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return getPoolDate(d);
  }, []);
  const currentISTHour = useMemo(() => getPoolHour(), []);

  // Synchronize with URL search parameter if changed
  useEffect(() => {
    if (paramType === "PUBLIC" || paramType === "FAMILY") {
      setBookingType(paramType);
    }
  }, [paramType]);

  // Handle switching between PUBLIC and FAMILY
  useEffect(() => {
    if (bookingType === "PUBLIC") {
      // If today and daytime public hours (09:00 - 16:00) have finished, default date to tomorrow
      if (currentISTHour >= 16) {
        setDate(tomorrowIST);
        setStartTime("09:00");
      } else {
        setDate(todayIST);
        // If current hour is between 9 and 15, choose next hour; else start at 09:00
        if (currentISTHour >= 9 && currentISTHour < 15) {
          setStartTime(`${String(currentISTHour + 1).padStart(2, "0")}:00`);
        } else {
          setStartTime("09:00");
        }
      }
      setGuestCount(2);
      setDurationHours(1);
    } else {
      // FAMILY
      // If current hour is >= 23, exclusive sessions finished for today
      if (currentISTHour >= 23) {
        setDate(tomorrowIST);
        setStartTime("09:00");
      } else {
        setDate(todayIST);
        if (currentISTHour >= 9 && currentISTHour < 22) {
          setStartTime(`${String(currentISTHour + 1).padStart(2, "0")}:00`);
        } else {
          setStartTime("09:00");
        }
      }
      setGuestCount(8);
      setDurationHours(1);
    }
  }, [bookingType, todayIST, tomorrowIST, currentISTHour]);

  // Real-time countdown for the 15-minute slot hold
  useEffect(() => {
    if (!holdExpiresAt || step !== 2) {
      setSecondsRemaining(null);
      return;
    }

    const updateTimer = () => {
      const nowTime = new Date().getTime();
      const expiry = new Date(holdExpiresAt).getTime();
      const diffSecs = Math.max(0, Math.floor((expiry - nowTime) / 1000));
      setSecondsRemaining(diffSecs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt, step]);

  // Calculate session bounds & allowed duration
  const sessionEndHour = bookingType === "PUBLIC" ? 16 : 23;
  const [startH] = startTime.split(":").map(Number);
  const maxAllowedHours = Math.max(1, Math.min(4, sessionEndHour - startH));

  // Auto-clamp duration when slot changes
  useEffect(() => {
    if (durationHours > maxAllowedHours) {
      setDurationHours(maxAllowedHours);
    }
  }, [startTime, maxAllowedHours, durationHours]);

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
            setAvailResult({ available: false, reason: data.error });
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
  const publicSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
  const familySlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
  ];
  const activeSlots = bookingType === "PUBLIC" ? publicSlots : familySlots;

  // Check if slot has already concluded today
  const isSlotPastToday = (slot: string) => {
    if (date !== todayIST) return false;
    const [slotH] = slot.split(":").map(Number);
    return slotH <= currentISTHour;
  };

  // Step 1 to Step 2: Request 15-Minute Slot Hold
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!availResult?.available) {
      setError(availResult?.reason || "This slot is not available. Please choose another time.");
      return;
    }
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
          date,
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

  // Pricing calculations
  const isFamily = bookingType === "FAMILY";
  const extraGuests = isFamily ? Math.max(0, guestCount - 12) : 0;
  const extraGuestFee = isFamily ? extraGuests * 100 * durationHours : 0;
  const clientBaseTotal = isFamily ? 1500 * durationHours : 150 * guestCount * durationHours;
  const clientComputedTotal = clientBaseTotal + extraGuestFee;

  // Authoritative server total or client fallback
  const computedTotal = availResult?.pricing?.totalPrice ?? clientComputedTotal;

  // Business Rule: Public swimming requires 100% full online payment.
  // Family booking requires configured advance (default ₹750).
  const requiredPaymentAmount = isFamily
    ? (availResult?.pricing?.advanceRequired ?? 750)
    : computedTotal;

  const remainingArrivalBalance = isFamily
    ? Math.max(0, computedTotal - requiredPaymentAmount)
    : 0;

  // Step 2: Confirm Sandbox Payment & Book
  const handleCompletePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdToken,
          customerName,
          customerPhone,
          customerEmail,
          bookingType,
          date,
          bookingDate: date,
          startTime,
          endTime,
          guestCount,
          notes,
          isStaffCreated: false,
          paymentMethod: "GATEWAY",
          initialAmount: requiredPaymentAmount,
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Step Progress Indicator */}
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

        {/* Title & Subtitle */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A192F] tracking-tight">
            Book Your Swimming Slot
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Choose between daytime public swimming or an exclusive evening family booking.
          </p>
        </div>

        {/* Top Segmented Session Toggle */}
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
                Public Swimming (9 AM – 4 PM)
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
                Family Exclusive (4 PM – 11 PM)
              </button>
            </div>
          </div>
        )}

        {/* Error / Warning Alert */}
        {error && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Unavailability Alert */}
        {step === 1 && availResult && !availResult.available && !error && (
          <div className="max-w-3xl mx-auto p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div className="leading-relaxed">
              <strong>Slot Unavailable:</strong> {availResult.reason}
            </div>
          </div>
        )}

        {/* Capacity Warning for Public Swimming */}
        {step === 1 && bookingType === "PUBLIC" && availResult?.isCapacityWarning && (
          <div className="max-w-3xl mx-auto p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-700" />
              <span>
                Occupancy: <strong>{availResult.currentGuests} / {availResult.maxCapacity}</strong> swimmers booked.
              </span>
            </div>
            <span className="font-semibold text-sky-700">
              {Math.max(0, availResult.maxCapacity - availResult.currentGuests)} spots remaining
            </span>
          </div>
        )}

        {/* STEP 1: Two-Column Form & Summary */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form Configuration */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              {/* 1. Select Date */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#0A192F]">
                    1. Select Date
                  </label>
                  {date === tomorrowIST && currentISTHour >= 16 && bookingType === "PUBLIC" && (
                    <span className="text-[10px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded font-medium">
                      Today&apos;s public hours ended • Showing tomorrow
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="date"
                    min={todayIST}
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
                    2. Select Start Time
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {isFamily ? "Full Day & Evening Exclusive (09:00 – 23:00)" : "Daytime Public (09:00 – 16:00)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {activeSlots.map((slot) => {
                    const isSelected = startTime === slot;
                    const isPast = isSlotPastToday(slot);

                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isPast}
                        onClick={() => {
                          setStartTime(slot);
                          // Auto clamp duration if slot is near closing
                          const [sH] = slot.split(":").map(Number);
                          const allowed = Math.max(1, Math.min(4, sessionEndHour - sH));
                          if (durationHours > allowed) {
                            setDurationHours(allowed);
                          }
                        }}
                        className={`p-2.5 rounded-lg border text-center transition ${
                          isPast
                            ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
                            : isSelected
                            ? "border-[#00838F] bg-[#00838F]/5 text-[#00838F] ring-1 ring-[#00838F]"
                            : "border-slate-200 bg-white hover:border-[#00838F]/40 text-slate-800"
                        }`}
                      >
                        <div className="font-bold text-xs font-mono">{formatTimeSlot(slot)}</div>
                        <div
                          className={`text-[10px] font-semibold mt-0.5 ${
                            isPast
                              ? "text-slate-400"
                              : isSelected
                              ? "text-[#00838F] font-bold"
                              : "text-emerald-700"
                          }`}
                        >
                          {isPast ? "Past" : isSelected ? "Selected" : "Available"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Number of Guests */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#0A192F]">
                    3. Number of Guests / Swimmers
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {isFamily ? "Max 30 guests" : "Max 25 swimmers (Capacity Cap)"}
                  </span>
                </div>
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
                      ? "Up to 12 people included in base rate (₹1,500/hr)"
                      : "₹150 per person per hour (full online payment required)"}
                  </span>
                </div>
              </div>

              {/* 4. Duration */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#0A192F]">
                    4. Duration
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {isFamily ? "Closes at 11:00 PM" : "Public sessions end at 4:00 PM"}
                  </span>
                </div>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="w-full sm:w-64 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00838F]"
                >
                  {[1, 2, 3, 4]
                    .filter((h) => h <= maxAllowedHours)
                    .map((h) => (
                      <option key={h} value={h}>
                        {h} Hour{h > 1 ? "s" : ""} (until {formatTimeSlot(getEndTime(startTime, h))})
                      </option>
                    ))}
                </select>
              </div>

              {/* 5. Contact Details */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="block text-xs font-bold text-[#0A192F]">
                  5. Contact &amp; Swimmer Details
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
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Context-Aware Session Rules Box */}
              {isFamily ? (
                <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2 text-[#00838F] font-bold">
                    <Info className="w-4 h-4" />
                    <span>Family Exclusive Booking Rules</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                    <li>Private exclusive sessions can be booked anytime between 9:00 AM and 11:00 PM.</li>
                    <li>100% Private Pool: Once booked, public swimming is completely closed for your confirmed slot.</li>
                    <li>Base rate is ₹1,500 per hour for up to 12 guests (100% private pool).</li>
                    <li>Additional guests above 12 add ₹100 per person per hour across duration.</li>
                    <li>₹750 online advance required to hold and confirm your exclusive slot.</li>
                    <li>Remaining balance payable at facility arrival (Cash / UPI).</li>
                  </ul>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2 text-[#00838F] font-bold">
                    <Info className="w-4 h-4" />
                    <span>Public Swimming Session Rules</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                    <li>Daytime public swimming operates between 9:00 AM and 4:00 PM.</li>
                    <li>Rate is ₹150 per person per hour with access to main heated pool.</li>
                    <li>Shared pool session strictly capped at 25 swimmers max capacity.</li>
                    <li>Full online payment is required at checkout to confirm admission.</li>
                    <li>Zero balance due on arrival — show your confirmation at reception.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Right Column: Authoritative Booking Summary Card */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5 sticky top-24">
              <h2 className="text-sm font-bold text-[#0A192F] tracking-tight pb-3 border-b border-slate-100">
                Booking Summary
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Booking Type</span>
                  <span className="font-bold text-slate-900">
                    {isFamily ? "Family Exclusive (Private)" : "Daily Public Swimming (Shared)"}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Date</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {date}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Time Slot</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatTimeSlot(startTime)} – {formatTimeSlot(endTime)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Duration</span>
                  <span className="font-semibold text-slate-900">
                    {durationHours} Hour{durationHours > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Swimmers / Guests</span>
                  <span className="font-semibold text-slate-900">
                    {guestCount} {isFamily && guestCount <= 12 ? "(up to 12 included)" : ""}
                  </span>
                </div>
              </div>

              {/* Price Details Divider */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <span className="block font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Price Calculation
                </span>

                {isFamily ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>Base Rate ({durationHours} hr{durationHours > 1 ? "s" : ""}, up to 12)</span>
                      <span className="font-mono text-slate-900">₹{1500 * durationHours}</span>
                    </div>

                    {extraGuests > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Extra Guests ({extraGuests} &times; ₹100/hr)</span>
                        <span className="font-mono text-slate-900">₹{extraGuestFee}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Public Swimming ({guestCount} guest{guestCount > 1 ? "s" : ""} &times; {durationHours} hr{durationHours > 1 ? "s" : ""})
                    </span>
                    <span className="font-mono text-slate-900">₹{computedTotal}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-sm text-[#0A192F] pt-2 border-t border-slate-100">
                  <span>Total Amount</span>
                  <span className="font-mono">₹{computedTotal}</span>
                </div>
              </div>

              {/* Payment Highlight Box */}
              {isFamily ? (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 text-xs text-amber-950">
                  <div className="font-bold flex items-center justify-between">
                    <span>Advance Payment (Required Online)</span>
                    <span className="text-base font-black font-mono">₹{requiredPaymentAmount}</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-tight">
                    Pay ₹{requiredPaymentAmount} now to reserve slot. Remaining ₹{remainingArrivalBalance} to be paid on arrival (Cash / UPI).
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5 text-xs text-emerald-950">
                  <div className="font-bold flex items-center justify-between">
                    <span>Online Admission Fee (100% Full Payment)</span>
                    <span className="text-base font-black font-mono">₹{requiredPaymentAmount}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-tight">
                    Website public bookings require full advance payment. Zero balance due on arrival.
                  </p>
                </div>
              )}

              {/* CTA Button */}
              <button
                type="button"
                disabled={loading || (availResult && !availResult.available)}
                onClick={handleProceedToPayment}
                className={`w-full font-bold py-3.5 rounded-lg text-xs shadow-xs transition duration-150 flex items-center justify-center gap-2 ${
                  availResult && !availResult.available
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-[#00838F] hover:bg-[#007079] text-white"
                }`}
              >
                {loading
                  ? "Holding Slot..."
                  : availResult && !availResult.available
                  ? "Slot Unavailable — Choose Another Time"
                  : `Proceed to Payment (₹${requiredPaymentAmount})`}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-tight">
                Locks slot for 15 minutes while completing secure checkout.
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
              <h2 className="text-xl font-black text-[#0A192F]">
                {isFamily ? "Complete Advance Payment" : "Complete Online Admission Payment"}
              </h2>
              <p className="text-xs text-slate-500">
                Your selected slot is reserved for 15 minutes while you complete payment verification.
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
                <span>Booking Type:</span>
                <span className="font-bold text-slate-900">{isFamily ? "Family Exclusive" : "Public Swimming"}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isFamily ? "Required Advance Online:" : "Admission Total Due Now:"}</span>
                <span className="font-bold text-emerald-700 text-sm font-mono">₹{requiredPaymentAmount}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span>Counter Balance Due on Arrival:</span>
                <span className="font-mono text-slate-900">
                  {remainingArrivalBalance > 0 ? `₹${remainingArrivalBalance}` : "₹0 (Paid in Full)"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleCompletePayment}
                className="w-full bg-[#00838F] hover:bg-[#007079] text-white font-bold py-3.5 rounded-lg text-xs shadow-xs transition"
              >
                {loading
                  ? "Confirming Gateway Transaction..."
                  : `Pay ₹${requiredPaymentAmount} & Confirm Booking`}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                &larr; Back to Slot Configuration
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
                <span>Booking Type:</span>
                <span className="font-bold text-slate-900">
                  {confirmedBooking.type === "FAMILY" ? "Exclusive Family Booking" : "Public Swimming"}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Session Date &amp; Time:</span>
                <span className="font-mono text-slate-900">
                  {confirmedBooking.bookingDate} ({formatTimeSlot(confirmedBooking.startTime)} – {formatTimeSlot(confirmedBooking.endTime)})
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Swimmers / Guests:</span>
                <span className="font-bold text-slate-900">{confirmedBooking.guestCount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Paid Online:</span>
                <span className="font-bold text-emerald-700 font-mono">₹{confirmedBooking.totalPaid}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span>Balance Due at Counter:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {confirmedBooking.balanceAmount > 0 ? `₹${confirmedBooking.balanceAmount}` : "₹0 (Fully Paid)"}
                </span>
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

export default function BookNowPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-mono text-xs">Loading booking engine...</div>}>
      <BookingContent />
    </Suspense>
  );
}
