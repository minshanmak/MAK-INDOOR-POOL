"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import BookingPassCard from "@/components/BookingPassCard";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ChevronLeft,
  Lock,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  Mail,
  Smartphone,
  Timer,
  Check,
  Sun,
  Moon,
  X,
} from "lucide-react";
import { getPoolDate, getPoolHour } from "@/lib/timezone";

function BookingContent() {
  const searchParams = useSearchParams();
  const paramType = searchParams.get("type")?.toUpperCase();
  const initialType: "PUBLIC" | "FAMILY" = paramType === "PUBLIC" ? "PUBLIC" : "FAMILY";

  // Streamlined 3-Step Wizard:
  // Step 1: Session & Slot (Type, Date, Time Slot, Duration & Guests, Price)
  // Step 2: Guest Details & Order Summary (Name, Phone, Place, Notes)
  // Step 3: Slot Hold & Checkout (15-min hold, UPI/Card/NetBanking, Instant Pass)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  const [bookingType, setBookingType] = useState<"PUBLIC" | "FAMILY">(initialType);
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("16:00");
  const [durationHours, setDurationHours] = useState<number>(1);
  const [guestCount, setGuestCount] = useState<number>(initialType === "FAMILY" ? 8 : 2);

  // Time Slot Filter (All vs Day vs Evening)
  const [slotFilter, setSlotFilter] = useState<"ALL" | "DAY" | "EVENING">("ALL");

  // Customer Contact Info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPlace, setCustomerPlace] = useState("");
  const [notes, setNotes] = useState("");

  // Payment Method choice
  const [selectedPayMethod, setSelectedPayMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
    place?: string;
  }>({});

  // Server-Authoritative State
  const [availResult, setAvailResult] = useState<any>(null);
  const [daySlots, setDaySlots] = useState<Record<string, { status: string; reason?: string; remainingCapacity?: number }>>({});
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [holdTtlMinutes, setHoldTtlMinutes] = useState<number>(15);
  const [maxCapacity, setMaxCapacity] = useState<number>(25);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Pool Timezone helper values (Asia/Kolkata)
  const todayIST = useMemo(() => getPoolDate(), []);
  const tomorrowIST = useMemo(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return getPoolDate(d);
  }, []);
  const dayAfterIST = useMemo(() => {
    const d = new Date(Date.now() + 48 * 60 * 60 * 1000);
    return getPoolDate(d);
  }, []);
  const currentISTHour = useMemo(() => getPoolHour(), []);

  // Format date helper for pills
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  };

  // Synchronize with URL search parameter if changed
  useEffect(() => {
    if (paramType === "PUBLIC" || paramType === "FAMILY") {
      setBookingType(paramType);
    }
  }, [paramType]);

  // Fetch authoritative slot availability for the selected date and session type
  useEffect(() => {
    if (!date) return;
    let isCancelled = false;

    const fetchDaySlots = async () => {
      try {
        const res = await fetch(`/api/availability?date=${encodeURIComponent(date)}&type=${encodeURIComponent(bookingType)}`);
        const json = await res.json();
        if (!isCancelled && json.slots) {
          setDaySlots(json.slots);
          if (json.holdTtlMinutes) setHoldTtlMinutes(json.holdTtlMinutes);
          if (json.maxCapacity) setMaxCapacity(json.maxCapacity);
        }
      } catch (e) {
        console.error("Failed to load day slots", e);
      }
    };

    fetchDaySlots();
    return () => {
      isCancelled = true;
    };
  }, [date, bookingType]);

  // Handle switching between PUBLIC and FAMILY defaults
  useEffect(() => {
    if (bookingType === "PUBLIC") {
      if (currentISTHour >= 16) {
        setDate((prev) => prev || tomorrowIST);
        setStartTime("09:00");
      } else {
        setDate((prev) => prev || todayIST);
        if (currentISTHour >= 9 && currentISTHour < 15) {
          setStartTime(`${String(currentISTHour + 1).padStart(2, "0")}:00`);
        } else {
          setStartTime("09:00");
        }
      }
      setGuestCount((prev) => (prev > 10 ? 2 : prev || 2));
      setDurationHours(1);
    } else {
      // FAMILY
      if (currentISTHour >= 23) {
        setDate((prev) => prev || tomorrowIST);
        setStartTime("09:00");
      } else {
        setDate((prev) => prev || todayIST);
        if (currentISTHour >= 9 && currentISTHour < 22) {
          setStartTime(`${String(currentISTHour + 1).padStart(2, "0")}:00`);
        } else {
          setStartTime("16:00");
        }
      }
      setGuestCount((prev) => (prev < 4 ? 8 : prev || 8));
      setDurationHours(1);
    }
  }, [bookingType, todayIST, tomorrowIST, currentISTHour]);

  // Real-time countdown for the 15-minute slot hold
  useEffect(() => {
    if (!holdExpiresAt || wizardStep !== 3 || confirmedBooking) {
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
  }, [holdExpiresAt, wizardStep, confirmedBooking]);

  // Session limits & duration clamping
  const sessionEndHour = bookingType === "PUBLIC" ? 16 : 23;
  const [startH] = startTime.split(":").map(Number);
  const maxAllowedHours = Math.max(1, Math.min(4, sessionEndHour - (startH || 9)));

  useEffect(() => {
    if (durationHours > maxAllowedHours) {
      setDurationHours(maxAllowedHours);
    }
  }, [startTime, maxAllowedHours, durationHours]);

  const isDurationColliding = (start: string, duration: number) => {
    const [startH] = start.split(":").map(Number);
    for (let offset = 1; offset < duration; offset++) {
      const intermediateSlot = `${String(startH + offset).padStart(2, "0")}:00`;
      const status = daySlots[intermediateSlot]?.status;
      if (status === "BOOKED" || status === "HELD") {
        return true;
      }
    }
    return false;
  };

  const getEndTime = (start: string, duration: number): string => {
    const [h, m] = start.split(":").map(Number);
    const totalMinutes = (h || 0) * 60 + (m || 0) + duration * 60;
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
            setAvailResult({ available: false, reason: data.error });
          } else {
            setAvailResult(data);
            if (data.slots) setDaySlots(data.slots);
            if (data.holdTtlMinutes) setHoldTtlMinutes(data.holdTtlMinutes);
            if (data.maxCapacity) setMaxCapacity(data.maxCapacity);
          }
        }
      } catch (err: any) {
        if (!isCancelled) console.error("Availability query failed", err);
      }
    };

    fetchAvail();
    return () => {
      isCancelled = true;
    };
  }, [date, startTime, endTime, bookingType, guestCount]);

  const formatTimeSlot = (time24: string) => {
    if (!time24) return "";
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
  const allSlots = bookingType === "PUBLIC" ? publicSlots : familySlots;

  const activeSlots = useMemo(() => {
    if (bookingType === "PUBLIC" || slotFilter === "ALL") return allSlots;
    if (slotFilter === "DAY") {
      return allSlots.filter((s) => Number(s.split(":")[0]) < 16);
    }
    return allSlots.filter((s) => Number(s.split(":")[0]) >= 16);
  }, [allSlots, bookingType, slotFilter]);

  const isSlotPastToday = (slot: string) => {
    if (date !== todayIST) return false;
    const [slotH] = slot.split(":").map(Number);
    return slotH <= currentISTHour;
  };

  // Auto-pick first available slot if currently selected is invalid
  useEffect(() => {
    if (!daySlots || Object.keys(daySlots).length === 0) return;
    const currentStatus = daySlots[startTime]?.status;
    if (currentStatus === "BOOKED" || currentStatus === "HELD" || currentStatus === "PAST") {
      const firstAvail = activeSlots.find((s) => daySlots[s]?.status === "AVAILABLE");
      if (firstAvail) setStartTime(firstAvail);
    }
  }, [daySlots, startTime, activeSlots]);

  // Pricing calculations
  const isFamily = bookingType === "FAMILY";
  const extraGuests = isFamily ? Math.max(0, guestCount - 12) : 0;
  const extraGuestFee = isFamily ? extraGuests * 100 * durationHours : 0;
  const clientBaseTotal = isFamily ? 1500 * durationHours : 150 * guestCount * durationHours;
  const clientComputedTotal = clientBaseTotal + extraGuestFee;
  const computedTotal = availResult?.pricing?.totalPrice ?? clientComputedTotal;

  const requiredPaymentAmount = isFamily
    ? (availResult?.pricing?.advanceRequired ?? 750)
    : computedTotal;

  const remainingArrivalBalance = isFamily
    ? Math.max(0, computedTotal - requiredPaymentAmount)
    : 0;

  // Step navigation
  const goToStep = (stepNumber: 1 | 2 | 3) => {
    setError(null);
    setWizardStep(stepNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Validation from Step 1 to Step 2
  const handleValidateStep1 = () => {
    setError(null);
    if (!date) {
      setError("Please select a date.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const slotInfo = daySlots[startTime];
    const isPast = isSlotPastToday(startTime) || slotInfo?.status === "PAST";
    if (isPast || slotInfo?.status === "BOOKED" || slotInfo?.status === "HELD") {
      setError("The selected start time slot is unavailable. Please pick an open slot.");
      window.scrollTo({ top: 180, behavior: "smooth" });
      return;
    }
    if (isDurationColliding(startTime, durationHours)) {
      setError("Selected duration overlaps with an existing booking. Please pick fewer hours.");
      window.scrollTo({ top: 250, behavior: "smooth" });
      return;
    }
    goToStep(2);
  };

  // Step 2 to Step 3: Hold slot for 15 minutes and proceed to payment
  const handleProceedToPayment = async () => {
    setError(null);
    const errors: { name?: string; phone?: string; place?: string } = {};

    if (!customerName.trim()) {
      errors.name = "Please enter your Full Name.";
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!customerPhone.trim()) {
      errors.phone = "Please enter your 10-digit Mobile Number.";
    } else if (cleanPhone.length < 10) {
      errors.phone = "Please enter a valid 10-digit Indian mobile number.";
    }
    if (!customerPlace.trim()) {
      errors.place = "Please enter or select your Place / Town.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = errors.phone || errors.name || errors.place || "Please check required fields.";
      setError(firstError);

      const cardEl = document.getElementById("guest-info-card");
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 120, behavior: "smooth" });
      }
      return;
    }

    setFieldErrors({});
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
      if (data.holdTtlMinutes) setHoldTtlMinutes(data.holdTtlMinutes);
      goToStep(3);
    } catch (err: any) {
      setError(err.message || "Could not reserve slot.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Complete Payment & Confirm Booking
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
          customerPlace,
          bookingType,
          date,
          bookingDate: date,
          startTime,
          endTime,
          guestCount,
          notes,
          isStaffCreated: false,
          paymentMethod: selectedPayMethod === "UPI" ? "UPI" : "GATEWAY",
          initialAmount: requiredPaymentAmount,
          transactionRef: `TRX-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm booking.");
      }

      setConfirmedBooking(data.booking);
    } catch (err: any) {
      setError(err.message || "Payment verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (totalSeconds: number | null) => {
    if (totalSeconds === null) return `${String(holdTtlMinutes).padStart(2, "0")}:00`;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-36 sm:pb-28 pt-2 sm:pt-6 selection:bg-[#1D68BD] selection:text-white">
      <div className="max-w-2xl mx-auto px-3.5 sm:px-6 space-y-4 sm:space-y-5">

        {/* Top Navigation & Step Indicator */}
        {!confirmedBooking && (
          <div className="sticky top-0 z-30 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 pt-2 pb-2.5 bg-slate-50/95 backdrop-blur-md border-b border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              {wizardStep === 1 ? (
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-2xs transition active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>Home</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep((wizardStep - 1) as any)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-2xs transition active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
                  <span>Back</span>
                </button>
              )}

              {/* Step Badge */}
              <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-2xs text-xs font-medium text-slate-600">
                <span className="font-semibold text-[#1D68BD]">
                  Step {wizardStep} of 3
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-800 font-medium">
                  {wizardStep === 1 && "Session & Timing"}
                  {wizardStep === 2 && "Guest Details"}
                  {wizardStep === 3 && "Payment"}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    wizardStep >= s ? "bg-[#1D68BD]" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Floating Mobile Toast Alert */}
        {error && (
          <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 p-3.5 rounded-xl bg-rose-600 text-white shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-5 h-5 shrink-0 text-white" />
              <span className="text-xs font-medium leading-tight line-clamp-2">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center shrink-0 active:scale-90 transition"
              title="Dismiss alert"
            >
              <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* =========================================================================
            STEP 1: SELECT SESSION & SLOTS (Type, Date, Slot, Duration, Guests)
           ========================================================================= */}
        {wizardStep === 1 && !confirmedBooking && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Clean Header */}
            <div className="text-center space-y-1 pt-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Book Your Pool Session
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Private pool rental for families or hourly public swimming passes
              </p>
            </div>

            {/* Session Type Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Family & Group Session */}
              <button
                type="button"
                onClick={() => setBookingType("FAMILY")}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all relative select-none border-2 ${
                  bookingType === "FAMILY"
                    ? "bg-blue-50/60 border-[#1D68BD] shadow-xs ring-1 ring-[#1D68BD]"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between pb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    bookingType === "FAMILY"
                      ? "bg-[#1D68BD] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    Private Session
                  </span>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    bookingType === "FAMILY"
                      ? "bg-[#1D68BD] text-white"
                      : "border-2 border-slate-300"
                  }`}>
                    {bookingType === "FAMILY" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    Family &amp; Group Session
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Entire pool reserved exclusively for your family or group.
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#1D68BD]" />
                    <span>Includes Main 25ft Pool &amp; Kids Pool</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5 shrink-0 text-[#1D68BD]" />
                    <span>Up to 12 guests included in base rate</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-baseline justify-between text-slate-900">
                  <div>
                    <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">₹1,500</span>
                    <span className="text-xs text-slate-500 ml-1">/ hour</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ₹750 advance lock
                  </span>
                </div>
              </button>

              {/* Option 2: Public Swimming */}
              <button
                type="button"
                onClick={() => setBookingType("PUBLIC")}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all relative select-none border-2 ${
                  bookingType === "PUBLIC"
                    ? "bg-blue-50/60 border-[#1D68BD] shadow-xs ring-1 ring-[#1D68BD]"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between pb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    bookingType === "PUBLIC"
                      ? "bg-[#1D68BD] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    Public Entry
                  </span>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    bookingType === "PUBLIC"
                      ? "bg-[#1D68BD] text-white"
                      : "border-2 border-slate-300"
                  }`}>
                    {bookingType === "PUBLIC" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    Public Swimming
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Hourly pass for individuals and kids during public hours.
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 shrink-0 text-[#1D68BD]" />
                    <span>Open 9:00 AM – 4:00 PM daily</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5 shrink-0 text-[#1D68BD]" />
                    <span>Pay per individual swimmer</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-baseline justify-between text-slate-900">
                  <div>
                    <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">₹150</span>
                    <span className="text-xs text-slate-500 ml-1">/ swimmer / hr</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                    Daytime only
                  </span>
                </div>
              </button>
            </div>

            {/* Date Selection */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1D68BD]" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    1. Select Date
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md tabular-nums">
                  {formatDateLabel(date)}
                </span>
              </div>

              {/* Quick Date Pills */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Today", dateVal: todayIST },
                  { label: "Tomorrow", dateVal: tomorrowIST },
                  { label: "Day After", dateVal: dayAfterIST },
                ].map(({ label, dateVal }) => {
                  const isSelected = date === dateVal;
                  const [y, m, d] = dateVal.split("-").map(Number);
                  const dt = new Date(y, m - 1, d);
                  const dayName = dt.toLocaleDateString("en-IN", { weekday: "short" });
                  const monthName = dt.toLocaleDateString("en-IN", { month: "short" });

                  return (
                    <button
                      key={dateVal}
                      type="button"
                      onClick={() => setDate(dateVal)}
                      className={`p-2.5 rounded-xl border text-center transition select-none active:scale-95 ${
                        isSelected
                          ? "bg-[#1D68BD] text-white border-[#1D68BD] shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className={`text-xs font-medium ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                        {label}
                      </div>
                      <div className="text-base font-bold tracking-tight tabular-nums mt-0.5">
                        {d} {monthName}
                      </div>
                      <div className={`text-xs font-normal ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                        {dayName}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Date Input */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-600">Or pick another date:</span>
                <input
                  type="date"
                  min={todayIST}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D68BD] cursor-pointer tabular-nums"
                />
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#1D68BD]" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    2. Select Start Time
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md tabular-nums">
                  {formatTimeSlot(startTime)}
                </span>
              </div>

              {/* Day/Evening Tabs for Family */}
              {isFamily && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setSlotFilter("ALL")}
                    className={`flex-1 py-1 rounded-lg transition ${slotFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600"}`}
                  >
                    All Slots
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotFilter("DAY")}
                    className={`flex-1 py-1 rounded-lg transition flex items-center justify-center gap-1.5 ${slotFilter === "DAY" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600"}`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Day (9 AM–4 PM)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotFilter("EVENING")}
                    className={`flex-1 py-1 rounded-lg transition flex items-center justify-center gap-1.5 ${slotFilter === "EVENING" ? "bg-white text-slate-900 shadow-2xs font-semibold" : "text-slate-600"}`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Evening (4 PM–11 PM)</span>
                  </button>
                </div>
              )}

              {/* Slots Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {activeSlots.map((slot) => {
                  const slotInfo = daySlots[slot];
                  const isPast = isSlotPastToday(slot) || slotInfo?.status === "PAST";
                  const isBooked = slotInfo?.status === "BOOKED";
                  const isHeld = slotInfo?.status === "HELD";
                  const isDisabled = isPast || isBooked || isHeld;
                  const isSelected = startTime === slot && !isDisabled;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        setStartTime(slot);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all select-none active:scale-95 ${
                        isSelected
                          ? "bg-[#1D68BD] border-[#1D68BD] text-white shadow-xs font-semibold"
                          : isPast
                          ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50"
                          : isBooked
                          ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                          : isHeld
                          ? "border-amber-200 bg-amber-50/70 text-amber-700 cursor-not-allowed"
                          : "border-slate-200 bg-white hover:border-[#1D68BD] text-slate-800"
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-semibold tracking-tight tabular-nums">
                        {formatTimeSlot(slot)}
                      </div>
                      <div className={`text-[11px] font-medium mt-0.5 ${
                        isSelected
                          ? "text-blue-100"
                          : isPast
                          ? "text-slate-400"
                          : isBooked
                          ? "text-slate-400"
                          : isHeld
                          ? "text-amber-600"
                          : "text-emerald-700"
                      }`}>
                        {isSelected
                          ? "Selected"
                          : isPast
                          ? "Past"
                          : isBooked
                          ? "Booked"
                          : isHeld
                          ? "Held"
                          : bookingType === "PUBLIC" && slotInfo?.remainingCapacity !== undefined && slotInfo.remainingCapacity < 10
                          ? `${slotInfo.remainingCapacity} Left`
                          : "Available"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Minimal Legend */}
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1.5 border-t border-slate-100">
                <span className="flex items-center gap-1.5 font-normal">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
                </span>
                <span className="flex items-center gap-1.5 font-normal">
                  <span className="w-2 h-2 rounded-full bg-[#1D68BD]" /> Selected
                </span>
                <span className="flex items-center gap-1.5 font-normal">
                  <span className="w-2 h-2 rounded-full bg-slate-300" /> Booked / Past
                </span>
              </div>
            </div>

            {/* Duration & Guests */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
              {/* Duration Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-[#1D68BD]" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      3. Duration
                    </h3>
                  </div>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md tabular-nums">
                    Until {formatTimeSlot(endTime)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4]
                    .filter((h) => h <= maxAllowedHours)
                    .map((h) => {
                      const collides = isDurationColliding(startTime, h);
                      return (
                        <button
                          key={h}
                          type="button"
                          disabled={collides}
                          onClick={() => setDurationHours(h)}
                          className={`py-2 px-1 rounded-xl border text-center transition select-none active:scale-95 ${
                            collides
                              ? "bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed"
                              : durationHours === h
                              ? "bg-[#1D68BD] text-white border-[#1D68BD] font-semibold shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                          }`}
                        >
                          <div className="text-xs sm:text-sm tabular-nums">{h} {h === 1 ? "Hour" : "Hours"}</div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Guests Count */}
              <div className="space-y-2.5 pt-3.5 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#1D68BD]" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      4. Number of Guests
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-normal">
                    {isFamily ? "Up to 30 guests" : `Max ${maxCapacity} swimmers`}
                  </span>
                </div>

                {/* Counter Control */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-1.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    className="w-10 h-10 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-100 active:scale-95 border border-slate-200 flex items-center justify-center text-lg select-none transition"
                  >
                    –
                  </button>
                  <div className="text-center">
                    <span className="text-3xl font-bold tracking-tight text-slate-900 block leading-tight tabular-nums">
                      {guestCount}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {guestCount === 1 ? "Swimmer" : "Swimmers / Guests"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuestCount(Math.min(isFamily ? 30 : maxCapacity, guestCount + 1))}
                    className="w-10 h-10 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-100 active:scale-95 border border-slate-200 flex items-center justify-center text-lg select-none transition"
                  >
                    +
                  </button>
                </div>

                {/* Quick Selection Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <span className="text-xs text-slate-400 font-medium shrink-0">Quick select:</span>
                  {isFamily ? (
                    [6, 10, 12, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGuestCount(num)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 active:scale-95 tabular-nums ${
                          guestCount === num ? "bg-[#1D68BD] text-white font-semibold" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {num} {num === 12 ? "(Base)" : ""}
                      </button>
                    ))
                  ) : (
                    [1, 2, 4, 6, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGuestCount(num)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 active:scale-95 tabular-nums ${
                          guestCount === num ? "bg-[#1D68BD] text-white font-semibold" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {num}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-lg py-3 px-4 pb-safe">
              <div className="max-w-2xl mx-auto space-y-2">
                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span className="truncate">{error}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-rose-500 hover:text-rose-800 text-xs font-medium shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-medium text-slate-500 block">
                      {isFamily ? "Advance Payable" : "Total Fee"}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                        ₹{requiredPaymentAmount}
                      </span>
                      {isFamily && (
                        <span className="text-xs text-slate-500 font-normal">
                          (Total: ₹{computedTotal})
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleValidateStep1}
                    className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-semibold py-3.5 px-6 rounded-xl text-sm shadow-md transition flex items-center gap-2 group shrink-0"
                  >
                    <span>Continue to Details</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: GUEST DETAILS & ORDER SUMMARY
           ========================================================================= */}
        {wizardStep === 2 && !confirmedBooking && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="text-center space-y-1 pt-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Guest Information &amp; Summary
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Please enter your contact details to reserve your slot
              </p>
            </div>

            {/* Order Summary Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
                Booking Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="font-normal">Session:</span>
                  <span className="font-medium text-slate-900">
                    {isFamily ? "Family & Group Session (Private Pool)" : "Public Swimming Session"}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span className="font-normal">Date &amp; Time:</span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {date} • {formatTimeSlot(startTime)} – {formatTimeSlot(endTime)} ({durationHours} hr)
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span className="font-normal">Guests:</span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {guestCount} Swimmers
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100">
                  <span className="font-normal">Total Amount:</span>
                  <span className="font-bold text-slate-900 text-sm tabular-nums">₹{computedTotal}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-medium text-slate-800">
                    {isFamily ? "Advance Required Online:" : "Total Payable Now:"}
                  </span>
                  <span className="font-bold text-base text-[#1D68BD] tabular-nums">
                    ₹{requiredPaymentAmount}
                  </span>
                </div>

                {isFamily && remainingArrivalBalance > 0 && (
                  <p className="text-[11px] text-slate-500 font-normal">
                    * Remaining balance of <strong>₹{remainingArrivalBalance}</strong> is payable at the counter upon arrival (Cash or UPI).
                  </p>
                )}
              </div>
            </div>

            {/* Guest Information Form */}
            <div id="guest-info-card" className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-[#1D68BD]" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Guest Information
                </h3>
              </div>

              <div className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      autoCapitalize="words"
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                        if (error) setError(null);
                      }}
                      className={`w-full pl-9 pr-3.5 py-3 sm:py-2.5 rounded-xl text-base sm:text-xs font-normal transition focus:outline-none focus:ring-2 ${
                        fieldErrors.name
                          ? "bg-rose-50/80 border-2 border-rose-500 text-rose-950 focus:ring-rose-400/30"
                          : "bg-slate-50 border border-slate-200 text-slate-900 focus:ring-[#1D68BD]"
                      }`}
                    />
                    <User className={`w-4 h-4 absolute left-3 top-3.5 sm:top-3 pointer-events-none ${fieldErrors.name ? "text-rose-500" : "text-slate-400"}`} />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.name}</span>
                    </p>
                  )}
                </div>

                {/* Mobile & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Mobile Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="99477XXXXX"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                          if (error) setError(null);
                        }}
                        className={`w-full pl-9 pr-3.5 py-3 sm:py-2.5 rounded-xl text-base sm:text-xs font-medium tracking-normal tabular-nums transition focus:outline-none focus:ring-2 ${
                          fieldErrors.phone
                            ? "bg-rose-50/80 border-2 border-rose-500 text-rose-950 focus:ring-rose-400/30"
                            : "bg-slate-50 border border-slate-200 text-slate-900 focus:ring-[#1D68BD]"
                        }`}
                      />
                      <Phone className={`w-4 h-4 absolute left-3 top-3.5 sm:top-3 pointer-events-none ${fieldErrors.phone ? "text-rose-500" : "text-slate-400"}`} />
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.phone}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="name@example.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68BD] transition"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Place / Town */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Place / Town / City <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">e.g. Moonniyur, Chelari</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter your town (e.g. Moonniyur)"
                      value={customerPlace}
                      onChange={(e) => {
                        setCustomerPlace(e.target.value);
                        if (fieldErrors.place) setFieldErrors((prev) => ({ ...prev, place: undefined }));
                        if (error) setError(null);
                      }}
                      className={`w-full pl-9 pr-3.5 py-3 sm:py-2.5 rounded-xl text-base sm:text-xs font-normal transition focus:outline-none focus:ring-2 ${
                        fieldErrors.place
                          ? "bg-rose-50/80 border-2 border-rose-500 text-rose-950 focus:ring-rose-400/30"
                          : "bg-slate-50 border border-slate-200 text-slate-900 focus:ring-[#1D68BD]"
                      }`}
                    />
                    <MapPin className={`w-4 h-4 absolute left-3 top-3.5 sm:top-3 pointer-events-none ${fieldErrors.place ? "text-rose-500" : "text-slate-400"}`} />
                  </div>
                  {fieldErrors.place && (
                    <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.place}</span>
                    </p>
                  )}

                  {/* Nearby Town Quick Selection */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar touch-pan-x">
                    <span className="text-xs text-slate-400 font-medium shrink-0">Nearby:</span>
                    {["Moonniyur", "Tirurangadi", "Chelari", "Calicut", "Kondotty", "Parappanangadi", "Kottakkal", "Tanur"].map((town) => (
                      <button
                        key={town}
                        type="button"
                        onClick={() => {
                          setCustomerPlace(town);
                          if (fieldErrors.place) setFieldErrors((prev) => ({ ...prev, place: undefined }));
                          if (error) setError(null);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 active:scale-95 ${
                          customerPlace.toLowerCase() === town.toLowerCase()
                            ? "bg-[#1D68BD] text-white font-semibold"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {town}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Special Requests <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Small children with party, require swim rings"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68BD] transition"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Bottom Bar for Step 2 */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-lg py-3 px-4 pb-safe">
              <div className="max-w-2xl mx-auto space-y-2">
                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span className="truncate">{error}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-rose-500 hover:text-rose-800 text-xs font-medium shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="py-3 px-3 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition active:scale-95"
                  >
                    &larr; Back
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleProceedToPayment}
                    className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-semibold py-3.5 px-6 rounded-xl text-sm shadow-md transition flex items-center gap-2 group shrink-0"
                  >
                    {loading ? (
                      <span>Reserving slot...</span>
                    ) : (
                      <>
                        <span>Proceed to Payment (₹{requiredPaymentAmount})</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: 15-MINUTE HOLD & CHECKOUT
           ========================================================================= */}
        {wizardStep === 3 && !confirmedBooking && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Clean Hold Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1D68BD] text-white flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Slot Reserved</div>
                  <div className="text-xs text-slate-600">
                    Held for <span className="font-semibold text-[#1D68BD] tabular-nums">{formatTimer(secondsRemaining)}</span>. Complete payment to confirm.
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-100">
                Payment Details
              </h3>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="font-normal">Primary Guest:</span>
                  <span className="font-medium text-slate-900">{customerName} ({customerPhone})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="font-normal">Session:</span>
                  <span className="font-medium text-slate-900 tabular-nums">{date} • {formatTimeSlot(startTime)} ({durationHours}h)</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span className="font-normal">Amount to Pay Now:</span>
                  <span className="font-bold text-base text-emerald-700 tabular-nums">₹{requiredPaymentAmount}</span>
                </div>
                {isFamily && remainingArrivalBalance > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span className="font-normal">Balance Due at Counter:</span>
                    <span className="font-medium text-slate-800 tabular-nums">₹{remainingArrivalBalance}</span>
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("UPI")}
                    className={`py-3 px-2 rounded-xl border text-center transition active:scale-95 select-none ${
                      selectedPayMethod === "UPI"
                        ? "bg-[#1D68BD] text-white border-[#1D68BD] font-semibold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs block">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("CARD")}
                    className={`py-3 px-2 rounded-xl border text-center transition active:scale-95 select-none ${
                      selectedPayMethod === "CARD"
                        ? "bg-[#1D68BD] text-white border-[#1D68BD] font-semibold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs block">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("NETBANKING")}
                    className={`py-3 px-2 rounded-xl border text-center transition active:scale-95 select-none ${
                      selectedPayMethod === "NETBANKING"
                        ? "bg-[#1D68BD] text-white border-[#1D68BD] font-semibold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                    }`}
                  >
                    <Lock className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-xs block">Net Banking</span>
                  </button>
                </div>
              </div>

              {/* Confirm Payment CTA */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompletePayment}
                  className="w-full bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-semibold py-3.5 rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <span>Confirming booking...</span>
                  ) : (
                    <>
                      <span>Pay ₹{requiredPaymentAmount} &amp; Confirm Booking</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  &larr; Back to Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clean Support Note */}
        {!confirmedBooking && (
          <div className="pt-4 pb-2 text-center space-y-1 text-xs text-slate-500">
            <div className="flex items-center justify-center gap-1.5 font-medium flex-wrap">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Kalathingalpara, Moonniyur</span>
              <span className="text-slate-300">•</span>
              <span>Daily 9:00 AM – 11:00 PM</span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">
              Need help or custom timing? Call / WhatsApp:{" "}
              <a
                href="https://wa.me/919947714716"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#1D68BD] hover:underline"
              >
                +91 99477 14716
              </a>
            </p>
          </div>
        )}

        {/* =========================================================================
            CONFIRMATION PASS (Success State)
           ========================================================================= */}
        {confirmedBooking && (
          <div className="max-w-md mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center space-y-1 pb-1">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Booking Confirmed
              </h2>
              <p className="text-xs text-slate-500 font-normal">
                Your pool reservation is locked. Show this pass at the counter upon arrival.
              </p>
            </div>

            {/* QR Booking Pass */}
            <BookingPassCard booking={confirmedBooking} showActions={true} />

            <div className="pt-2 text-center space-y-2">
              <Link
                href={`/booking-status?ref=${confirmedBooking.id}&phone=${customerPhone}`}
                className="inline-block text-xs text-[#1D68BD] hover:underline font-semibold py-1"
              >
                Go to Self-Service &amp; Reschedule Portal &rarr;
              </Link>
              <div>
                <Link
                  href="/"
                  className="inline-block text-center text-xs text-slate-500 hover:text-slate-900 font-medium py-1 transition"
                >
                  &larr; Return to Home Page
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function BookNowPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 text-xs font-medium">Loading booking engine...</div>}>
      <BookingContent />
    </Suspense>
  );
}
