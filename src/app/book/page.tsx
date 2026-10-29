"use client";

import React, { useState, useEffect } from "react";
import {
  Waves,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  Printer,
  ChevronRight,
  Lock,
  Sparkles,
} from "lucide-react";

export default function BookNowPage() {
  const [bookingType, setBookingType] = useState<"PUBLIC" | "FAMILY">("FAMILY");
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("17:00");
  const [durationHours, setDurationHours] = useState<number>(2);
  const [guestCount, setGuestCount] = useState<number>(10);

  // Customer Details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Booking Flow State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Slot & Pricing, 2: Details & Hold, 3: Payment, 4: Confirmed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server-validated pricing & availability
  const [availResult, setAvailResult] = useState<any>(null);
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  // Update default start time when booking type changes
  useEffect(() => {
    if (bookingType === "PUBLIC") {
      setStartTime("10:00");
    } else {
      setStartTime("17:00");
    }
  }, [bookingType]);

  // Compute end time based on start time + duration
  const getEndTime = (start: string, duration: number): string => {
    const [h, m] = start.split(":").map(Number);
    const totalMinutes = h * 60 + (m || 0) + duration * 60;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  const endTime = getEndTime(startTime, durationHours);

  // Check availability and fetch authoritative pricing from server
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
      } catch (err: any) {
        if (!isCancelled) setError("Network error checking availability");
      }
    };

    fetchAvail();
    return () => {
      isCancelled = true;
    };
  }, [bookingType, date, startTime, durationHours, guestCount]);

  // Step 1 -> Step 2: Proceed to Customer Details
  const handleProceedToDetails = () => {
    if (!availResult?.available) {
      setError(availResult?.reason || "This slot is not available. Please choose another time.");
      return;
    }
    setError(null);
    setStep(2);
  };

  // Step 2 -> Step 3: Create Temporary Hold and Proceed to Payment
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

  // Step 3 -> Step 4: Complete Payment & Confirm Booking
  const handleSimulatePayment = async (shouldSucceed: boolean) => {
    if (!shouldSucceed) {
      setError("Payment failed or cancelled. Slot is still held for you to retry.");
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
          transactionRef: `SIM-TRX-${Date.now()}`,
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Title & Progress Tracker */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Book Your Swimming Slot</h1>
        <p className="text-slate-600 text-sm mt-1">
          Instant real-time availability confirmation and secure online reservation
        </p>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${step === 1 ? "bg-ocean-600 text-white" : "bg-slate-200 text-slate-700"}`}>
            1. Select Slot
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${step === 2 ? "bg-ocean-600 text-white" : "bg-slate-200 text-slate-700"}`}>
            2. Customer Details
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${step === 3 ? "bg-ocean-600 text-white" : "bg-slate-200 text-slate-700"}`}>
            3. Payment
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${step === 4 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}>
            4. Confirmed
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div>{error}</div>
        </div>
      )}

      {/* STEP 1: Select Type, Date, Time & Guests */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          {/* Booking Type Toggle */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Choose Booking Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setBookingType("FAMILY")}
                className={`p-4 rounded-xl border text-left transition flex items-start gap-3 ${
                  bookingType === "FAMILY"
                    ? "border-lagoon-500 bg-lagoon-50/50 ring-2 ring-lagoon-500"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`p-2 rounded-lg ${bookingType === "FAMILY" ? "bg-lagoon-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    Exclusive Family Booking
                    <span className="text-[10px] bg-lagoon-100 text-lagoon-800 font-extrabold px-1.5 py-0.5 rounded">
                      POPULAR
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    4:00 PM – 11:00 PM | ₹1,500/hr (up to 12 guests). 100% private pool.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBookingType("PUBLIC")}
                className={`p-4 rounded-xl border text-left transition flex items-start gap-3 ${
                  bookingType === "PUBLIC"
                    ? "border-ocean-500 bg-ocean-50/50 ring-2 ring-ocean-500"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`p-2 rounded-lg ${bookingType === "PUBLIC" ? "bg-ocean-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Daily Public Swimming</div>
                  <p className="text-xs text-slate-500 mt-1">
                    9:00 AM – 4:00 PM | ₹150/hr per person. Shared pool sessions.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Date & Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Hours)</label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
              >
                <option value={1}>1 Hour (Ends at {getEndTime(startTime, 1)})</option>
                <option value={2}>2 Hours (Ends at {getEndTime(startTime, 2)})</option>
                <option value={3}>3 Hours (Ends at {getEndTime(startTime, 3)})</option>
                <option value={4}>4 Hours (Ends at {getEndTime(startTime, 4)})</option>
              </select>
            </div>
          </div>

          {/* Guest Count */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-700">Number of Guests / Swimmers</label>
              {bookingType === "FAMILY" && guestCount > 12 && (
                <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                  +{guestCount - 12} extra guest(s) @ ₹100/hr
                </span>
              )}
            </div>
            <input
              type="number"
              min={1}
              max={bookingType === "PUBLIC" ? 25 : 35}
              value={guestCount}
              onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>

          {/* Server Availability & Price Breakdown Card */}
          {availResult && (
            <div className="border border-ocean-200 bg-ocean-50/60 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-ocean-950 flex items-center gap-1.5">
                  {availResult.available ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Slot Available ({date} from {startTime} to {endTime})
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      {availResult.reason || "Slot Unavailable"}
                    </>
                  )}
                </span>
                {bookingType === "PUBLIC" && availResult.maxCapacity && (
                  <span className="text-xs text-ocean-700">
                    Capacity: {availResult.currentGuests || 0} / {availResult.maxCapacity} occupied
                  </span>
                )}
              </div>

              {availResult.pricing && (
                <div className="bg-white rounded-lg p-4 border border-ocean-100 text-sm space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Booking Price ({durationHours} hr):</span>
                    <span className="font-semibold text-slate-900">₹{availResult.pricing.basePrice}</span>
                  </div>
                  {availResult.pricing.extraGuestPrice > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Extra Guests Charge:</span>
                      <span className="font-semibold text-slate-900">+₹{availResult.pricing.extraGuestPrice}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900 text-base">
                    <span>Total Calculated Amount:</span>
                    <span className="text-ocean-700">₹{availResult.pricing.totalPrice}</span>
                  </div>
                  <div className="flex justify-between text-xs text-lagoon-700 font-semibold bg-lagoon-50 p-2 rounded">
                    <span>Required Online Advance Payment:</span>
                    <span>₹{availResult.pricing.advanceRequired}</span>
                  </div>
                  {availResult.pricing.initialBalance > 0 && (
                    <div className="flex justify-between text-xs text-slate-500 px-2">
                      <span>Remaining Balance at Pool Check-in:</span>
                      <span>₹{availResult.pricing.initialBalance}</span>
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
              className="bg-gradient-to-r from-ocean-600 to-lagoon-600 hover:from-ocean-500 hover:to-lagoon-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              Continue to Customer Details
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Customer Contact Information */}
      {step === 2 && (
        <form onSubmit={handleCreateHold} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Customer Details & Slot Hold</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              We reserve a 15-minute temporary hold on your slot so you can securely complete payment without losing it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Mohammed Faizal"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone Number *</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9847012345"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Optional)</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="e.g. faizal@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Special Notes / Requests</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Need kids float jackets / birthday gathering"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            />
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-slate-600 hover:text-slate-900 text-sm font-semibold"
            >
              &larr; Back to Slot Selection
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-ocean-600 to-lagoon-600 hover:from-ocean-500 hover:to-lagoon-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {loading ? "Holding Slot..." : "Reserve Hold & Proceed to Pay"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: Payment & Verification */}
      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Secure Online Payment</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {bookingType === "FAMILY"
                  ? "Pay ₹750 advance online to confirm your exclusive family booking."
                  : "Pay full amount online to confirm public swimming slot."}
              </p>
            </div>
            {holdExpiresAt && (
              <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Slot Held for 15 mins
              </span>
            )}
          </div>

          {/* Payment Summary Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Customer:</span>
              <span className="font-semibold text-slate-900">{customerName} ({customerPhone})</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Booking Type:</span>
              <span className="font-semibold text-slate-900">{bookingType === "FAMILY" ? "Exclusive Family Booking" : "Public Swimming"}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Scheduled Time:</span>
              <span className="font-semibold text-slate-900">{date} | {startTime} – {endTime}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-base text-slate-900">
              <span>Amount Due Now:</span>
              <span className="text-emerald-700">₹{availResult?.pricing?.advanceRequired || 750}</span>
            </div>
          </div>

          {/* Simulated / Sandbox Gateway Banner */}
          <div className="border-2 border-dashed border-lagoon-400 bg-lagoon-50/50 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-lagoon-900 font-bold text-sm">
              <CreditCard className="w-5 h-5 text-lagoon-600" />
              <span>Payment Gateway Simulation (Development Mode)</span>
            </div>
            <p className="text-xs text-lagoon-800 leading-relaxed">
              In development, payments are processed via our verified test adapter. In production, this securely connects with Razorpay / UPI gateway.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSimulatePayment(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {loading ? "Verifying..." : `Pay ₹${availResult?.pricing?.advanceRequired || 750} (Simulate Success)`}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSimulatePayment(false)}
                className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-3 px-4 rounded-lg text-xs border border-red-200 transition"
              >
                Simulate Payment Failure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Confirmed Receipt */}
      {step === 4 && confirmedBooking && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Booking Confirmed!</h2>
            <p className="text-sm text-slate-600">
              Your pool slot is securely reserved. Please show this receipt or booking reference at the pool counter.
            </p>
          </div>

          {/* Printable Receipt Card */}
          <div id="booking-receipt" className="border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-4 text-sm">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-extrabold text-ocean-950 text-base">M.A.K INDOOR POOL</h3>
                <p className="text-xs text-slate-500">Aluva, Ernakulam, Kerala | +91 94470 12345</p>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase font-bold text-slate-500 block">Booking Reference</span>
                <span className="font-mono font-bold text-base text-ocean-700">{confirmedBooking.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Customer Name</span>
                <strong className="text-slate-800 text-sm">{confirmedBooking.customerName}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Customer Phone</span>
                <strong className="text-slate-800 text-sm">{confirmedBooking.customerPhone}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Booking Type</span>
                <strong className="text-slate-800 text-sm">
                  {confirmedBooking.type === "FAMILY" ? "Exclusive Family Booking" : "Public Swimming"}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Scheduled Time</span>
                <strong className="text-slate-800 text-sm">
                  {confirmedBooking.bookingDate} ({confirmedBooking.startTime} – {confirmedBooking.endTime})
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Guests</span>
                <strong className="text-slate-800 text-sm">{confirmedBooking.guestCount} Persons</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Payment Status</span>
                <strong className="text-emerald-700 text-sm uppercase">{confirmedBooking.paymentStatus}</strong>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-bold">₹{confirmedBooking.totalAmount}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Amount Paid Online:</span>
                <span>₹{confirmedBooking.totalPaid}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-sm">
                <span>Balance to Pay at Counter:</span>
                <span>₹{confirmedBooking.balanceAmount}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-4 py-2.5 rounded-lg text-sm transition"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>

            <a
              href={`/booking-status?id=${confirmedBooking.id}&phone=${confirmedBooking.customerPhone}`}
              className="bg-ocean-600 hover:bg-ocean-500 text-white font-bold px-6 py-2.5 rounded-lg text-sm shadow transition"
            >
              Manage / View Booking Online &rarr;
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
