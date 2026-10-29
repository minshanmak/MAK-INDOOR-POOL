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
  const [startTime, setStartTime] = useState<string>("17:00");
  const [durationHours, setDurationHours] = useState<number>(2);
  const [guestCount, setGuestCount] = useState<number>(10);

  // Customer Contact Info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Step Tracker
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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
      setStartTime("10:00");
    } else {
      setStartTime("17:00");
    }
  }, [bookingType]);

  // Real-time ticking countdown for the 15-minute slot hold
  useEffect(() => {
    if (!holdExpiresAt || step !== 3) {
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
        const res = await fetch(
          `/api/availability?type=${bookingType}&date=${date}&startTime=${startTime}&endTime=${endTime}&guests=${guestCount}`
        );
        const data = await res.json();
        if (!isCancelled) {
          if (!res.ok) {
            setError(data.error || "Failed to check availability");
            setAvailResult(null);
          } else {
            setAvailResult(data);
          }
        }
      } catch (err) {
        if (!isCancelled) setError("Network error checking availability");
      }
    };

    fetchAvail();
    return () => {
      isCancelled = true;
    };
  }, [bookingType, date, startTime, durationHours, guestCount]);

  const handleProceedToDetails = () => {
    if (!availResult?.available) {
      setError(availResult?.reason || "This slot is not available. Please choose another time.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleCreateHold = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Please provide your full name and phone number.");
      return;
    }

    if (customerPhone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit mobile phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType,
          date,
          startTime,
          endTime,
          guestCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to hold slot.");
      }

      setHoldToken(data.holdToken);
      setHoldExpiresAt(new Date(data.expiresAt));
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to reserve temporary slot hold.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async (shouldSucceed: boolean) => {
    if (!shouldSucceed) {
      setError("Simulated payment declined. Your slot hold remains active so you can retry.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const paymentAmount = availResult?.pricing?.advanceRequired || 750;

      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holdToken,
          bookingType,
          date,
          startTime,
          endTime,
          guestCount,
          customerName,
          customerPhone,
          customerEmail,
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
      setStep(4);
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Editorial Header */}
      <div className="border-b border-slate-200/90 pb-5 mb-8">
        <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs font-semibold mb-2">
          <span>Authoritative Booking Engine</span>
          <span className="text-slate-400">•</span>
          <span>15-Minute Slot Hold</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Reserve a Swimming Session
        </h1>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Real-time slot availability, transparent advance billing, and instant verified confirmation.
        </p>

        {/* Clean Segmented Progress Bar */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          <div
            className={`h-1.5 rounded-full transition-colors ${
              step >= 1 ? "bg-cyan-600" : "bg-slate-200"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-colors ${
              step >= 2 ? "bg-cyan-600" : "bg-slate-200"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-colors ${
              step >= 3 ? "bg-cyan-600" : "bg-slate-200"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-colors ${
              step >= 4 ? "bg-emerald-600" : "bg-slate-200"
            }`}
          />
        </div>
        <div className="flex justify-between text-[11px] font-semibold text-slate-500 mt-2">
          <span className={step === 1 ? "text-cyan-700 font-bold" : ""}>1. Slot & Pricing</span>
          <span className={step === 2 ? "text-cyan-700 font-bold" : ""}>2. Swimmer Info</span>
          <span className={step === 3 ? "text-cyan-700 font-bold" : ""}>3. Advance Checkout</span>
          <span className={step === 4 ? "text-emerald-700 font-bold" : ""}>4. Confirmation</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* STEP 1: Select Type, Date, Duration & Guests */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Segmented Session Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Session Type *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBookingType("FAMILY")}
                className={`p-4 rounded-xl border text-left transition ${
                  bookingType === "FAMILY"
                    ? "border-cyan-600 bg-cyan-50/50 ring-1 ring-cyan-600 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900">Exclusive Family Booking</span>
                  <span className="text-[10px] font-mono font-bold bg-cyan-100 text-cyan-900 px-1.5 py-0.5 rounded">
                    4 PM – 11 PM
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ₹1,500/hr up to 12 people (+₹100/hr for extra guests). 100% private pool deck.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setBookingType("PUBLIC")}
                className={`p-4 rounded-xl border text-left transition ${
                  bookingType === "PUBLIC"
                    ? "border-cyan-600 bg-cyan-50/50 ring-1 ring-cyan-600 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900">Daily Public Swimming</span>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                    9 AM – 4 PM
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ₹150/hr per swimmer. Shared pool session strictly capped at 25 concurrent swimmers.
                </p>
              </button>
            </div>
          </div>

          {/* Date, Time, Duration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Booking Date *
              </label>
              <input
                type="date"
                required
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Time *
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-1 focus:ring-cyan-500 font-medium"
              >
                {bookingType === "PUBLIC" ? (
                  <>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                  </>
                ) : (
                  <>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                    <option value="19:00">07:00 PM</option>
                    <option value="20:00">08:00 PM</option>
                    <option value="21:00">09:00 PM</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Duration Chips */}
          <div>
            <div className="flex justify-between items-center mb-1 text-[11px]">
              <label className="font-bold text-slate-700 uppercase tracking-wider">
                Session Duration *
              </label>
              <span className="text-slate-500 font-mono">
                Ends at: <strong className="text-slate-900">{endTime}</strong>
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => setDurationHours(hrs)}
                  className={`py-2 rounded-lg text-xs font-bold transition border ${
                    durationHours === hrs
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {hrs} {hrs === 1 ? "Hour" : "Hours"}
                </button>
              ))}
            </div>
          </div>

          {/* Guest Count Stepper */}
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Total Swimmers / Attendees *
              </label>
              {bookingType === "FAMILY" && guestCount > 12 && (
                <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium text-[11px]">
                  +{guestCount - 12} extra guest(s) @ ₹100/hr
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                className="w-10 h-10 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-base"
              >
                -
              </button>

              <input
                type="number"
                min={1}
                max={bookingType === "PUBLIC" ? 25 : 35}
                value={guestCount}
                onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-center font-mono font-bold text-sm text-slate-900"
              />

              <button
                type="button"
                onClick={() =>
                  setGuestCount(
                    Math.min(bookingType === "PUBLIC" ? 25 : 35, guestCount + 1)
                  )
                }
                className="w-10 h-10 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-base"
              >
                +
              </button>
            </div>

            {/* Quick Guest Presets */}
            {bookingType === "FAMILY" && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
                {[4, 8, 12, 16, 20].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setGuestCount(preset)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition border ${
                      guestCount === preset
                        ? "bg-cyan-100 text-cyan-900 border-cyan-300"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {preset} {preset === 12 ? "(Base)" : "guests"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Authoritative Pricing & Availability Breakdown */}
          {availResult && (
            <div className="border border-slate-200 bg-slate-50 rounded-lg p-5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  {availResult.available ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Slot Available: {date} ({startTime} – {endTime})</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{availResult.reason}</span>
                    </>
                  )}
                </span>
                {bookingType === "PUBLIC" && (
                  <span className="text-[11px] text-slate-500 font-mono">
                    Occupancy: {availResult.currentGuests || 0} / {availResult.maxCapacity || 25}
                  </span>
                )}
              </div>

              {availResult.pricing && (
                <div className="bg-white rounded-lg p-4 border border-slate-200 text-xs space-y-2 tabular-nums">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Duration Rate ({durationHours} hr):</span>
                    <span className="font-semibold text-slate-900">
                      ₹{availResult.pricing.basePrice}
                    </span>
                  </div>
                  {availResult.pricing.extraGuestPrice > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>
                        Extra Guests ({guestCount - 12} extra × ₹100 × {durationHours} hr):
                      </span>
                      <span className="font-semibold text-slate-900">
                        +₹{availResult.pricing.extraGuestPrice}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Calculated Amount:</span>
                    <span className="text-cyan-800">₹{availResult.pricing.totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-semibold bg-emerald-50 p-2 rounded text-[11px]">
                    <span>Required Online Advance (Due Now):</span>
                    <span>₹{availResult.pricing.advanceRequired}</span>
                  </div>
                  {availResult.pricing.initialBalance > 0 && (
                    <div className="flex justify-between text-slate-500 px-2 text-[11px]">
                      <span>Remaining Balance at Pool Counter:</span>
                      <span className="font-bold">₹{availResult.pricing.initialBalance}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              disabled={!availResult?.available}
              onClick={handleProceedToDetails}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-xs shadow-xs transition flex items-center gap-2"
            >
              <span>Continue to Contact Details</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Customer Contact Info */}
      {step === 2 && (
        <form
          onSubmit={handleCreateHold}
          className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Customer Contact Details</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Proceeding reserves a 15-minute temporary slot hold on our authoritative booking engine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Mohammed Faizal"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile Phone (10 Digits) *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9847012345"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-1 focus:ring-cyan-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="e.g. faizal@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Special Notes / Requests
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific requests e.g. kids life jackets / family birthday"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Slot Selection</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg text-xs shadow-xs transition flex items-center gap-2"
            >
              <span>{loading ? "Reserving Hold..." : "Hold Slot & Proceed to Pay"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Payment & Advance Verification */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Advance Payment Checkout</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {bookingType === "FAMILY"
                  ? "Pay ₹750 flat advance to confirm exclusive family reservation."
                  : "Pay full amount online to confirm public slot."}
              </p>
            </div>

            {/* Live Ticking Countdown Badge */}
            <div
              className={`px-3 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 ${
                secondsRemaining !== null && secondsRemaining < 120
                  ? "bg-rose-100 text-rose-800 animate-pulse"
                  : "bg-amber-50 text-amber-900 border border-amber-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Slot Held: {formatTimer(secondsRemaining)}</span>
            </div>
          </div>

          {secondsRemaining === 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <strong>Hold Expired:</strong> Your 15-minute temporary slot hold has expired. Slots are automatically released to prevent locks.
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="font-bold underline ml-1 text-rose-950"
                >
                  Return to select slot again
                </button>
              </div>
            </div>
          )}

          {/* Booking Summary */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2 tabular-nums">
            <div className="flex justify-between text-slate-600">
              <span>Customer:</span>
              <strong className="text-slate-900">{customerName} ({customerPhone})</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Session Type:</span>
              <strong className="text-slate-900">
                {bookingType === "FAMILY" ? "Exclusive Family Booking (100% Private)" : "Daily Public Swimming"}
              </strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Scheduled Time:</span>
              <strong className="text-slate-900">{date} • {startTime} – {endTime}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Attendees:</span>
              <span className="text-slate-900 font-semibold">{guestCount} Swimmers</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
              <span>Online Payment Due Today:</span>
              <span className="text-emerald-700">₹{availResult?.pricing?.advanceRequired || 750}</span>
            </div>
            {availResult?.pricing?.initialBalance > 0 && (
              <div className="flex justify-between text-slate-500 text-[11px] pt-1">
                <span>Remaining Counter Balance:</span>
                <span className="font-bold text-slate-700">₹{availResult.pricing.initialBalance} (Cash / UPI)</span>
              </div>
            )}
          </div>

          {/* Development Payment Adapter */}
          <div className="border border-slate-200 bg-slate-50/60 rounded-lg p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <CreditCard className="w-4 h-4 text-cyan-600" />
              <span>Simulated Payment Gateway (Local Sandbox)</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              In production, this integrates with UPI / Netbanking gateway with server-side webhook signature validation. For testing:
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                disabled={loading || secondsRemaining === 0}
                onClick={() => handleSimulatePayment(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow-xs transition"
              >
                {loading
                  ? "Verifying Payment..."
                  : `Simulate Successful Payment (₹${availResult?.pricing?.advanceRequired || 750})`}
              </button>

              <button
                type="button"
                disabled={loading || secondsRemaining === 0}
                onClick={() => handleSimulatePayment(false)}
                className="bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2.5 px-4 rounded-lg text-xs border border-slate-200 transition"
              >
                Simulate Payment Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Confirmed Receipt */}
      {step === 4 && confirmedBooking && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="text-center space-y-1.5 border-b border-slate-100 pb-5">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Booking Confirmed</h2>
            <p className="text-xs text-slate-500">
              Your pool slot is securely confirmed in our authoritative database.
            </p>
          </div>

          {/* Printable Official Receipt */}
          <div id="booking-receipt" className="border border-slate-200 rounded-lg p-6 bg-slate-50 text-xs space-y-4">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">M.A.K INDOOR POOL</h3>
                <p className="text-[11px] text-slate-500">Near Metro Junction, Aluva, Ernakulam, Kerala</p>
                <p className="text-[11px] text-slate-500 font-mono">Phone: +91 94470 12345</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">
                  Booking Reference
                </span>
                <div className="flex items-center gap-1.5 justify-end mt-0.5">
                  <span className="font-mono font-bold text-sm text-cyan-800">{confirmedBooking.id}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(confirmedBooking.id)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    title="Copy Reference"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Customer Name</span>
                <strong className="text-slate-900 text-xs block mt-0.5">{confirmedBooking.customerName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Mobile Number</span>
                <strong className="text-slate-900 text-xs block mt-0.5 font-mono">{confirmedBooking.customerPhone}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Session Type</span>
                <strong className="text-slate-900 text-xs block mt-0.5">
                  {confirmedBooking.type === "FAMILY" ? "Exclusive Family" : "Public Swimming"}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Date & Time</span>
                <strong className="text-slate-900 text-xs block mt-0.5 tabular-nums">
                  {confirmedBooking.bookingDate} ({confirmedBooking.startTime} – {confirmedBooking.endTime})
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Party Size</span>
                <strong className="text-slate-900 text-xs block mt-0.5">{confirmedBooking.guestCount} Persons</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Payment Status</span>
                <strong className="text-emerald-700 text-xs block mt-0.5 uppercase">{confirmedBooking.paymentStatus}</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-1 text-xs tabular-nums">
              <div className="flex justify-between">
                <span>Total Calculated Amount:</span>
                <span className="font-semibold text-slate-900">₹{confirmedBooking.totalAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Online Advance Paid:</span>
                <span>₹{confirmedBooking.totalPaid}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-sm">
                <span>Remaining Counter Balance:</span>
                <span className="text-amber-700">₹{confirmedBooking.balanceAmount}</span>
              </div>
            </div>

            {/* Arrival Instructions Checklist */}
            <div className="p-3 bg-white rounded border border-slate-200 space-y-1.5 text-[11px] text-slate-600">
              <span className="font-bold text-slate-900 block uppercase tracking-wider text-[10px]">
                Arrival & Facility Checklist
              </span>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Please arrive at least 15 minutes before your scheduled start time.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Synthetic nylon/spandex swimsuits, shorts, or burkinis mandatory in water.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Remaining balance of ₹{confirmedBooking.balanceAmount} payable at counter via UPI or Cash.</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Receipt</span>
            </button>

            <Link
              href={`/booking-status?id=${confirmedBooking.id}&phone=${confirmedBooking.customerPhone}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-xs transition"
            >
              <span>Self-Service Booking Portal &rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
