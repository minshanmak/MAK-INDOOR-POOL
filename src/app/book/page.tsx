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
  ChevronRight,
  Lock,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  Mail,
  Smartphone,
  Waves,
  Timer,
  Check,
  Sun,
  Moon,
  Sparkles,
  X,
  LifeBuoy,
  Ticket,
  BadgeCheck,
} from "lucide-react";
import { getPoolDate, getPoolHour } from "@/lib/timezone";

function BookingContent() {
  const searchParams = useSearchParams();
  const paramType = searchParams.get("type")?.toUpperCase();
  const initialType: "PUBLIC" | "FAMILY" = paramType === "PUBLIC" ? "PUBLIC" : "FAMILY";

  // Streamlined 3-Step Wizard:
  // Step 1: Session & Slot (Type, Date, Time Slot, Duration & Guests, Live Price)
  // Step 2: Guest Details & Review (Name, Phone, Place, Notes, Order Summary)
  // Step 3: Slot Hold & Secure Payment (15-min hold, UPI/Card/NetBanking, Instant Pass)
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

  // Format date helper for quick pills
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
    <div className="min-h-screen bg-[#F2F6FA] text-slate-800 pb-36 sm:pb-28 pt-2 sm:pt-6 selection:bg-[#1D68BD] selection:text-white relative overflow-hidden">
      {/* Handcrafted ambient light orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#1D68BD]/10 via-[#0284C7]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-2xl mx-auto px-3.5 sm:px-6 space-y-4 sm:space-y-5 relative z-10">

        {/* =========================================================================
            HANDCRAFTED TOP NAVIGATION & PROGRESS HEADER
           ========================================================================= */}
        {!confirmedBooking && (
          <div className="sticky top-0 z-30 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 pt-2 pb-2.5 bg-[#F2F6FA]/90 backdrop-blur-md border-b border-slate-200/60 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              {wizardStep === 1 ? (
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-200/90 px-3.5 py-1.5 rounded-full shadow-2xs transition active:scale-95 group"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  <span>Home</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep((wizardStep - 1) as any)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-200/90 px-3.5 py-1.5 rounded-full shadow-2xs transition active:scale-95 group"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                  <span>Back</span>
                </button>
              )}

              {/* Handcrafted Step Indicator */}
              <div className="inline-flex items-center gap-2 bg-white/95 border border-slate-200/80 px-3.5 py-1.5 rounded-full shadow-2xs text-[11px] font-bold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-[#1D68BD] animate-pulse" />
                <span className="text-[#1D68BD] font-black uppercase tracking-wider">
                  Step {wizardStep} of 3
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-semibold">
                  {wizardStep === 1 && "Session & Slot"}
                  {wizardStep === 2 && "Guest Details"}
                  {wizardStep === 3 && "Secure Payment"}
                </span>
              </div>
            </div>

            {/* Tactile Progress Segment Line */}
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    wizardStep >= s
                      ? "bg-[#1D68BD] shadow-[0_1px_4px_rgba(29,104,189,0.35)]"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Floating Mobile Toast Alert - Always visible at top of viewport */}
        {error && (
          <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 p-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-[0_10px_30px_rgba(225,29,72,0.35)] flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200 border border-rose-400/30">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertCircle className="w-5 h-5 shrink-0 text-white" />
              <span className="text-xs font-bold leading-tight line-clamp-2">{error}</span>
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

        {/* Global In-Page Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-2.5 text-xs shadow-2xs animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="leading-relaxed font-semibold">{error}</div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-900 text-[10px] uppercase font-black shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* =========================================================================
            STEP 1: SELECT SESSION & SLOTS (Type, Date, Slot, Duration, Guests)
           ========================================================================= */}
        {wizardStep === 1 && !confirmedBooking && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Handcrafted Hero Header */}
            <div className="text-center space-y-1 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100/70 border border-sky-200/80 text-[10px] font-black uppercase tracking-wider text-[#1D68BD] shadow-2xs mb-1">
                <Sparkles className="w-3 h-3 text-[#1D68BD]" />
                <span>M.A.K Indoor Pool • Moonniyur</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Select Your Pool Experience
              </h1>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Exclusive private resort-style rental for families, or hourly daytime public swimming
              </p>
            </div>

            {/* Handcrafted Session Passes (Family vs Public) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Family & Group Pass */}
              <button
                type="button"
                onClick={() => setBookingType("FAMILY")}
                className={`w-full text-left p-4 sm:p-5 rounded-3xl transition-all relative overflow-hidden select-none active:scale-[0.99] border-2 ${
                  bookingType === "FAMILY"
                    ? "bg-gradient-to-br from-slate-950 via-[#0A192F] to-[#0D284B] text-white border-[#0284C7] shadow-[0_12px_30px_rgba(2,132,199,0.22)] ring-2 ring-[#0284C7]/40"
                    : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80 shadow-sm"
                }`}
              >
                {/* Gold Highlight Badge */}
                <div className="flex items-center justify-between pb-2.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    bookingType === "FAMILY"
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs"
                      : "bg-purple-100 text-purple-800"
                  }`}>
                    ★ 100% Private Pool
                  </span>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    bookingType === "FAMILY"
                      ? "bg-cyan-400 text-slate-950 shadow-xs"
                      : "border-2 border-slate-300"
                  }`}>
                    {bookingType === "FAMILY" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className={`text-base sm:text-lg font-black tracking-tight ${bookingType === "FAMILY" ? "text-white" : "text-slate-900"}`}>
                    Family &amp; Group Session
                  </h3>
                  <p className={`text-[11px] leading-relaxed ${bookingType === "FAMILY" ? "text-slate-300" : "text-slate-500"}`}>
                    Entire pool &amp; lounge locked exclusively for your family.
                  </p>
                </div>

                {/* Handcrafted Features List */}
                <div className={`mt-3 pt-3 border-t space-y-1.5 text-[11px] ${
                  bookingType === "FAMILY" ? "border-slate-800/80 text-cyan-200" : "border-slate-100 text-slate-600"
                }`}>
                  <div className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span>Main Pool &amp; shallow Kids Pool included</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Users className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span>Up to 12 guests included in base price</span>
                  </div>
                </div>

                {/* Price Footer */}
                <div className={`mt-3 pt-3 border-t flex items-baseline justify-between ${
                  bookingType === "FAMILY" ? "border-slate-800 text-white" : "border-slate-100 text-slate-900"
                }`}>
                  <div>
                    <span className="text-xl font-black font-mono">₹1,500</span>
                    <span className={`text-[11px] font-medium ml-1 ${bookingType === "FAMILY" ? "text-slate-400" : "text-slate-500"}`}>/ hour</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    bookingType === "FAMILY" ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30" : "bg-slate-100 text-slate-700"
                  }`}>
                    ₹750 Advance Lock
                  </span>
                </div>
              </button>

              {/* Option 2: Public Swimming Pass */}
              <button
                type="button"
                onClick={() => setBookingType("PUBLIC")}
                className={`w-full text-left p-4 sm:p-5 rounded-3xl transition-all relative overflow-hidden select-none active:scale-[0.99] border-2 ${
                  bookingType === "PUBLIC"
                    ? "bg-gradient-to-br from-slate-950 via-[#0A192F] to-[#0D284B] text-white border-[#0284C7] shadow-[0_12px_30px_rgba(2,132,199,0.22)] ring-2 ring-[#0284C7]/40"
                    : "bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80 shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between pb-2.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    bookingType === "PUBLIC"
                      ? "bg-gradient-to-r from-sky-400 to-sky-500 text-slate-950 shadow-xs"
                      : "bg-sky-100 text-sky-800"
                  }`}>
                    Open Public Swimming
                  </span>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    bookingType === "PUBLIC"
                      ? "bg-cyan-400 text-slate-950 shadow-xs"
                      : "border-2 border-slate-300"
                  }`}>
                    {bookingType === "PUBLIC" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className={`text-base sm:text-lg font-black tracking-tight ${bookingType === "PUBLIC" ? "text-white" : "text-slate-900"}`}>
                    Public Swimmer Pass
                  </h3>
                  <p className={`text-[11px] leading-relaxed ${bookingType === "PUBLIC" ? "text-slate-300" : "text-slate-500"}`}>
                    Daytime entry for individual swimmers and children.
                  </p>
                </div>

                <div className={`mt-3 pt-3 border-t space-y-1.5 text-[11px] ${
                  bookingType === "PUBLIC" ? "border-slate-800/80 text-cyan-200" : "border-slate-100 text-slate-600"
                }`}>
                  <div className="flex items-center gap-1.5 font-medium">
                    <Waves className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span>Available daily from 9:00 AM to 4:00 PM</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <LifeBuoy className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                    <span>Showers, changing rooms &amp; lockers included</span>
                  </div>
                </div>

                <div className={`mt-3 pt-3 border-t flex items-baseline justify-between ${
                  bookingType === "PUBLIC" ? "border-slate-800 text-white" : "border-slate-100 text-slate-900"
                }`}>
                  <div>
                    <span className="text-xl font-black font-mono">₹150</span>
                    <span className={`text-[11px] font-medium ml-1 ${bookingType === "PUBLIC" ? "text-slate-400" : "text-slate-500"}`}>/ swimmer / hr</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    bookingType === "PUBLIC" ? "bg-cyan-400/20 text-cyan-300 border border-cyan-400/30" : "bg-slate-100 text-slate-700"
                  }`}>
                    9:00 AM – 4:00 PM
                  </span>
                </div>
              </button>
            </div>

            {/* Handcrafted Date Selection */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-sky-50 text-[#1D68BD] flex items-center justify-center">
                    <Calendar className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    1. Select Date
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-[#1D68BD] bg-sky-50 px-3 py-1 rounded-full font-mono border border-sky-100">
                  {formatDateLabel(date)}
                </span>
              </div>

              {/* Quick Date Cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Today", dateVal: todayIST },
                  { label: "Tomorrow", dateVal: tomorrowIST },
                  { label: "Next Day", dateVal: dayAfterIST },
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
                      className={`p-2.5 sm:p-3 rounded-2xl border text-center transition select-none active:scale-95 ${
                        isSelected
                          ? "bg-slate-950 text-white border-slate-950 shadow-md ring-2 ring-[#0284C7]/40"
                          : "bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 text-slate-700"
                      }`}
                    >
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-cyan-300" : "text-slate-400"}`}>
                        {label}
                      </div>
                      <div className="text-sm sm:text-base font-black font-mono mt-0.5">
                        {d} {monthName}
                      </div>
                      <div className={`text-[10px] font-semibold ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                        {dayName}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Date Input */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span className="text-[11px] font-medium flex items-center gap-1">
                  <span>Pick custom date:</span>
                </span>
                <input
                  type="date"
                  min={todayIST}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1D68BD] cursor-pointer shadow-2xs"
                />
              </div>
            </div>

            {/* Handcrafted Time Slot Tokens */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-sky-50 text-[#1D68BD] flex items-center justify-center">
                    <Clock className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    2. Pick Start Time
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  Selected: {formatTimeSlot(startTime)}
                </span>
              </div>

              {/* Day/Evening Segmented Tabs for Family */}
              {isFamily && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSlotFilter("ALL")}
                    className={`flex-1 py-1.5 rounded-xl transition ${slotFilter === "ALL" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600"}`}
                  >
                    All Slots (14)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotFilter("DAY")}
                    className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${slotFilter === "DAY" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600"}`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Day (9 AM–4 PM)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotFilter("EVENING")}
                    className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${slotFilter === "EVENING" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600"}`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Evening (4 PM–11 PM)</span>
                  </button>
                </div>
              )}

              {/* Slot Tokens Grid: 3-col on mobile, 4-col on desktop */}
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
                      className={`p-2.5 sm:p-3 rounded-2xl border text-center transition-all select-none active:scale-95 relative overflow-hidden ${
                        isSelected
                          ? "bg-slate-950 border-slate-950 text-white shadow-md ring-2 ring-[#0284C7]/50"
                          : isPast
                          ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50"
                          : isBooked
                          ? "border-rose-100 bg-rose-50/70 text-rose-700 cursor-not-allowed"
                          : isHeld
                          ? "border-amber-100 bg-amber-50/70 text-amber-700 cursor-not-allowed"
                          : "border-slate-200/90 bg-white hover:border-[#1D68BD] text-slate-800 hover:shadow-2xs"
                      }`}
                    >
                      <div className={`text-xs sm:text-sm font-black font-mono tracking-tight ${isSelected ? "text-white" : ""}`}>
                        {formatTimeSlot(slot)}
                      </div>
                      <div
                        className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mt-0.5 truncate flex items-center justify-center gap-1 ${
                          isSelected
                            ? "text-cyan-300 font-extrabold"
                            : isPast
                            ? "text-slate-400"
                            : isBooked
                            ? "text-rose-600 font-black"
                            : isHeld
                            ? "text-amber-600"
                            : "text-emerald-700"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isSelected
                            ? "bg-cyan-300 animate-ping"
                            : isPast
                            ? "bg-slate-300"
                            : isBooked
                            ? "bg-rose-500"
                            : isHeld
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`} />
                        <span>
                          {isSelected
                            ? "Selected"
                            : isPast
                            ? "Past"
                            : isBooked
                            ? "Booked"
                            : isHeld
                            ? "Hold"
                            : bookingType === "PUBLIC" && slotInfo?.remainingCapacity !== undefined && slotInfo.remainingCapacity < 10
                            ? `${slotInfo.remainingCapacity} Left`
                            : "Open"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Visual Legend */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1.5 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Open Slot
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-slate-950" /> Selected
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Booked
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> In Hold
                </span>
              </div>
            </div>

            {/* Handcrafted Duration & Guests Card */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] space-y-4">
              {/* Duration Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-sky-50 text-[#1D68BD] flex items-center justify-center">
                      <Timer className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      3. Duration
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full font-mono">
                    Ends at {formatTimeSlot(endTime)}
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
                          className={`py-2.5 px-1.5 rounded-2xl border text-center transition select-none active:scale-95 ${
                            collides
                              ? "bg-rose-50 border-rose-100 text-rose-400 opacity-60 cursor-not-allowed"
                              : durationHours === h
                              ? "bg-slate-950 text-white border-slate-950 font-black shadow-xs ring-2 ring-[#0284C7]/40"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold"
                          }`}
                        >
                          <div className="text-xs sm:text-sm font-mono">{h} {h === 1 ? "Hr" : "Hrs"}</div>
                          <div className={`text-[9px] mt-0.5 truncate font-semibold ${
                            collides ? "text-rose-500 font-bold" : durationHours === h ? "text-cyan-300" : "text-slate-400"
                          }`}>
                            {collides ? "Collides" : `${h * 60} mins`}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Swimmers Section */}
              <div className="space-y-2.5 pt-3.5 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-sky-50 text-[#1D68BD] flex items-center justify-center">
                      <Users className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      4. Guest Count
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-bold">
                    {isFamily ? "Up to 30 Guests" : `Max ${maxCapacity} Swimmers`}
                  </span>
                </div>

                {/* Tactile Counter Widget */}
                <div className="flex items-center justify-between bg-slate-100/90 rounded-2xl p-1.5 border border-slate-200/90 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    className="w-12 h-12 rounded-xl bg-white text-slate-800 font-black hover:bg-slate-50 active:scale-95 shadow-sm flex items-center justify-center text-xl select-none transition"
                  >
                    –
                  </button>
                  <div className="text-center">
                    <span className="text-2xl font-black font-mono text-slate-950 block leading-tight">
                      {guestCount}
                    </span>
                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">
                      {guestCount === 1 ? "Swimmer" : "Swimmers / Guests"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuestCount(Math.min(isFamily ? 30 : maxCapacity, guestCount + 1))}
                    className="w-12 h-12 rounded-xl bg-white text-slate-800 font-black hover:bg-slate-50 active:scale-95 shadow-sm flex items-center justify-center text-xl select-none transition"
                  >
                    +
                  </button>
                </div>

                {/* Quick Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider shrink-0">Quick:</span>
                  {isFamily ? (
                    [6, 10, 12, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGuestCount(num)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 active:scale-95 ${
                          guestCount === num ? "bg-slate-950 text-white shadow-2xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
                        className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 active:scale-95 ${
                          guestCount === num ? "bg-slate-950 text-white shadow-2xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {num}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* STICKY BOTTOM ACTION BAR (Thumb Friendly) */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] py-3 px-4 pb-safe">
              <div className="max-w-2xl mx-auto space-y-2">
                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span className="truncate">{error}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-rose-500 hover:text-rose-800 text-[10px] uppercase font-bold shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-black block uppercase tracking-wider">
                      {isFamily ? "Advance Payable" : "Total Fee"}
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-950 font-mono tracking-tight">
                        ₹{requiredPaymentAmount}
                      </span>
                      {isFamily && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          (Total: ₹{computedTotal})
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleValidateStep1}
                    className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs sm:text-sm shadow-md shadow-blue-700/20 transition flex items-center gap-2 group shrink-0"
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
            STEP 2: GUEST DETAILS & VOUCHER REVIEW
           ========================================================================= */}
        {wizardStep === 2 && !confirmedBooking && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="text-center space-y-1 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-black uppercase tracking-wider text-emerald-700 shadow-2xs mb-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Slot Verified &amp; Ready</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                Review &amp; Guest Details
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Verify your reservation pass and provide visitor details
              </p>
            </div>

            {/* Handcrafted Reservation Voucher / Pass Preview */}
            <div className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] relative overflow-hidden space-y-3.5">
              {/* Top Perforated Ticket Header */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1D68BD] flex items-center justify-center">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Reservation Pass
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {isFamily ? "Family & Group Exclusive" : "Public Swimming"}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Instant Confirmed
                </span>
              </div>

              {/* Voucher Item Breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Date &amp; Hours:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {date} • {formatTimeSlot(startTime)} – {formatTimeSlot(endTime)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Guests &amp; Duration:</span>
                  <span className="font-bold text-slate-900">
                    {guestCount} Guests ({durationHours} Hour{durationHours > 1 ? "s" : ""})
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span className="font-medium">Included Pool Facilities:</span>
                  <span className="font-bold text-emerald-700">
                    Main 25ft Pool + Kids Splash Pool
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100 font-bold">
                  <span>Total Booking Charge:</span>
                  <span className="font-mono text-slate-900 text-sm">₹{computedTotal}</span>
                </div>

                {/* Payable Box */}
                <div className="flex justify-between items-center text-xs font-bold text-emerald-800 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200">
                  <span>{isFamily ? "Advance Payable Now:" : "Total Amount Payable:"}</span>
                  <span className="text-base font-mono font-black text-emerald-700">₹{requiredPaymentAmount}</span>
                </div>

                {isFamily && remainingArrivalBalance > 0 && (
                  <p className="text-[11px] text-slate-500 leading-tight">
                    * Remaining balance of <strong>₹{remainingArrivalBalance}</strong> is payable at reception on arrival (Cash or UPI).
                  </p>
                )}
              </div>
            </div>

            {/* Handcrafted Guest Information Form */}
            <div id="guest-info-card" className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-sky-50 text-[#1D68BD] flex items-center justify-center">
                  <User className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Guest Information
                </h3>
              </div>

              <div className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                      className={`w-full pl-9 pr-3.5 py-3 sm:py-2.5 rounded-2xl text-base sm:text-xs font-semibold transition focus:outline-none focus:ring-2 ${
                        fieldErrors.name
                          ? "bg-rose-50/80 border-2 border-rose-500 text-rose-950 focus:ring-rose-400/30"
                          : "bg-slate-50 border border-slate-200 text-slate-900 focus:ring-[#1D68BD]"
                      }`}
                    />
                    <User className={`w-4 h-4 absolute left-3 top-3.5 sm:top-3 pointer-events-none ${fieldErrors.name ? "text-rose-500" : "text-slate-400"}`} />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.name}</span>
                    </p>
                  )}
                </div>

                {/* Mobile & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                        className={`w-full pl-9 pr-3.5 py-3 sm:py-2.5 rounded-2xl text-base sm:text-xs font-mono font-bold transition focus:outline-none focus:ring-2 ${
                          fieldErrors.phone
                            ? "bg-rose-50/80 border-2 border-rose-500 text-rose-950 focus:ring-rose-400/30"
                            : "bg-slate-50 border border-slate-200 text-slate-900 focus:ring-[#1D68BD]"
                        }`}
                      />
                      <Phone className={`w-4 h-4 absolute left-3 top-3.5 sm:top-3 pointer-events-none ${fieldErrors.phone ? "text-rose-500" : "text-slate-400"}`} />
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fieldErrors.phone}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
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
                        className="w-full pl-9 pr-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68BD] transition"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Place / Town with Quick Suggestions */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Place / Town / City <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">e.g. Moonniyur, Chelari</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter your locality (e.g. Moonniyur)"
                      value={customerPlace}
                      onChange={(e) => {
                        setCustomerPlace(e.target.value);
                        if (fieldErrors.place) setFieldErrors((prev) => ({ ...prev, place: undefined }));
                        if (error) setError(null);
                      }}
                      className={`w-full pl-9 pr-3.5 py-3 sm:py-2.5 rounded-2xl text-base sm:text-xs font-semibold transition focus:outline-none focus:ring-2 ${
                        fieldErrors.place
                          ? "bg-rose-50/80 border-2 border-rose-500 text-rose-950 focus:ring-rose-400/30"
                          : "bg-slate-50 border border-slate-200 text-slate-900 focus:ring-[#1D68BD]"
                      }`}
                    />
                    <MapPin className={`w-4 h-4 absolute left-3 top-3.5 sm:top-3 pointer-events-none ${fieldErrors.place ? "text-rose-500" : "text-slate-400"}`} />
                  </div>
                  {fieldErrors.place && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.place}</span>
                    </p>
                  )}

                  {/* Quick Nearby Town Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar touch-pan-x">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Nearby:</span>
                    {["Moonniyur", "Tirurangadi", "Chelari", "Calicut", "Kondotty", "Parappanangadi", "Kottakkal", "Tanur"].map((town) => (
                      <button
                        key={town}
                        type="button"
                        onClick={() => {
                          setCustomerPlace(town);
                          if (fieldErrors.place) setFieldErrors((prev) => ({ ...prev, place: undefined }));
                          if (error) setError(null);
                        }}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition shrink-0 active:scale-95 ${
                          customerPlace.toLowerCase() === town.toLowerCase()
                            ? "bg-slate-950 text-white shadow-2xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {town}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Special Requests <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Small children with party, require swim rings"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1D68BD] transition"
                  />
                </div>
              </div>
            </div>

            {/* STICKY BOTTOM BAR FOR STEP 2 */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] py-3 px-4 pb-safe">
              <div className="max-w-2xl mx-auto space-y-2">
                {error && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span className="truncate">{error}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className="text-rose-500 hover:text-rose-800 text-[10px] uppercase font-bold shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="py-3 px-3 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 transition active:scale-95"
                  >
                    &larr; Back
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleProceedToPayment}
                    className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-extrabold py-3.5 px-6 rounded-2xl text-xs sm:text-sm shadow-md shadow-blue-700/20 transition flex items-center gap-2 group shrink-0"
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
            STEP 3: 15-MINUTE HOLD & SECURE CHECKOUT
           ========================================================================= */}
        {wizardStep === 3 && !confirmedBooking && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Handcrafted Digital Lock Countdown Banner */}
            <div className="bg-gradient-to-br from-slate-950 via-[#0A192F] to-[#0D284B] text-white rounded-3xl p-5 text-center space-y-2 shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 text-[11px] font-black uppercase tracking-wider">
                <Timer className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Slot Locked for {holdTtlMinutes} Minutes</span>
              </div>

              <div className="text-4xl font-black font-mono tracking-widest text-cyan-400 pt-1">
                {formatTimer(secondsRemaining)}
              </div>

              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                No one else can take this slot while you complete checkout.
              </p>
            </div>

            {/* Payment Details Card */}
            <div className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] space-y-3.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Order Review
              </h3>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <span className="font-bold text-slate-900">{customerName} ({customerPhone})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Session:</span>
                  <span className="font-bold font-mono text-slate-900">{date} • {formatTimeSlot(startTime)} ({durationHours}h)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Session Type:</span>
                  <span className="font-bold text-slate-900">{isFamily ? "Family & Group (Private)" : "Public Swimming"}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200 font-bold">
                  <span>Amount Due Now:</span>
                  <span className="font-mono font-black text-base text-emerald-700">₹{requiredPaymentAmount}</span>
                </div>
                {isFamily && remainingArrivalBalance > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Balance at Pool Counter:</span>
                    <span className="font-mono font-bold text-slate-800">₹{remainingArrivalBalance}</span>
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("UPI")}
                    className={`py-3 px-2 rounded-2xl border text-center transition active:scale-95 select-none ${
                      selectedPayMethod === "UPI"
                        ? "bg-slate-950 text-white border-slate-950 font-black shadow-xs ring-2 ring-[#0284C7]/50"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                    <span className="text-[11px] block">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("CARD")}
                    className={`py-3 px-2 rounded-2xl border text-center transition active:scale-95 select-none ${
                      selectedPayMethod === "CARD"
                        ? "bg-slate-950 text-white border-slate-950 font-black shadow-xs ring-2 ring-[#0284C7]/50"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                    <span className="text-[11px] block">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("NETBANKING")}
                    className={`py-3 px-2 rounded-2xl border text-center transition active:scale-95 select-none ${
                      selectedPayMethod === "NETBANKING"
                        ? "bg-slate-950 text-white border-slate-950 font-black shadow-xs ring-2 ring-[#0284C7]/50"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold"
                    }`}
                  >
                    <Lock className="w-4 h-4 mx-auto mb-1 text-cyan-400" />
                    <span className="text-[11px] block">Net Banking</span>
                  </button>
                </div>
              </div>

              {/* Confirm Payment CTA */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompletePayment}
                  className="w-full bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <span>Confirming Transaction...</span>
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

        {/* Distraction-Free Trust & Support Note */}
        {!confirmedBooking && (
          <div className="pt-6 pb-2 text-center space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center justify-center gap-2 font-medium flex-wrap">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>256-Bit SSL Encrypted Slot Lock</span>
              <span className="text-slate-300">•</span>
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Kalathingalpara, Moonniyur</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Need booking help or special timing? Call / WhatsApp:{" "}
              <a
                href="https://wa.me/919947714716"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#1D68BD] hover:underline"
              >
                +91 99477 14716
              </a>
            </p>
          </div>
        )}

        {/* =========================================================================
            DIGITAL BOOKING PASS & RECEIPT (Success State)
           ========================================================================= */}
        {confirmedBooking && (
          <div className="max-w-md mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-300">
            {/* Success Header */}
            <div className="text-center space-y-1 pb-1">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h2 className="text-2xl font-black text-slate-950">
                Booking Confirmed!
              </h2>
              <p className="text-xs text-slate-500">
                Your pool reservation is locked. Show this pass at the counter upon arrival.
              </p>
            </div>

            {/* High-Resolution QR Booking Pass with Instant Download & WhatsApp Sharing */}
            <BookingPassCard booking={confirmedBooking} showActions={true} />

            <div className="pt-2 text-center space-y-2">
              <Link
                href={`/booking-status?ref=${confirmedBooking.id}&phone=${customerPhone}`}
                className="inline-block text-xs text-[#1D68BD] hover:underline font-bold py-1"
              >
                Go to Self-Service &amp; Reschedule Portal &rarr;
              </Link>
              <div>
                <Link
                  href="/"
                  className="inline-block text-center text-xs text-slate-500 hover:text-slate-900 font-semibold py-1 transition"
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-mono text-xs">Loading booking engine...</div>}>
      <BookingContent />
    </Suspense>
  );
}
