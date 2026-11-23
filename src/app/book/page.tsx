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
      setError("Please select a valid date.");
      return;
    }
    const slotInfo = daySlots[startTime];
    const isPast = isSlotPastToday(startTime) || slotInfo?.status === "PAST";
    if (isPast || slotInfo?.status === "BOOKED" || slotInfo?.status === "HELD") {
      setError("The selected start time slot is unavailable. Please select an available slot.");
      return;
    }
    if (isDurationColliding(startTime, durationHours)) {
      setError("Your selected duration overlaps with an already booked slot. Please select fewer hours or a different start time.");
      return;
    }
    goToStep(2);
  };

  // Step 2 to Step 3: Hold slot for 15 minutes and proceed to payment
  const handleProceedToPayment = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerPlace.trim()) {
      setError("Please enter your Full Name, 10-digit Mobile Number, and Place / Town.");
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
    <div className="min-h-screen bg-gradient-to-b from-[#F0F5FA] via-[#F4F8FC] to-[#EEF4FA] text-slate-800 pb-36 sm:pb-28 pt-2 sm:pt-6 selection:bg-slate-900 selection:text-white">
      <div className="max-w-2xl mx-auto px-3.5 sm:px-6 space-y-3.5 sm:space-y-5">

        {/* =========================================================================
            STICKY TOP APP-STYLE HEADER & PROGRESS (Steps 1 to 3)
           ========================================================================= */}
        {!confirmedBooking && (
          <div className="sticky top-0 z-30 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 pt-2 pb-2.5 bg-[#F0F5FA]/90 backdrop-blur-md border-b border-slate-200/60 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              {wizardStep === 1 ? (
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-200/90 px-3 py-1 rounded-full shadow-2xs transition active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Home</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep((wizardStep - 1) as any)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-200/90 px-3 py-1 rounded-full shadow-2xs transition active:scale-95"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              {/* iOS Step Pill */}
              <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-1 rounded-full shadow-2xs text-[11px] font-bold text-slate-700">
                <span className="text-[#0284C7] font-extrabold">Step {wizardStep} of 3</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">
                  {wizardStep === 1 && "Session & Slot"}
                  {wizardStep === 2 && "Guest Details"}
                  {wizardStep === 3 && "Secure Payment"}
                </span>
              </div>
            </div>

            {/* Apple Segmented 3-Step Progress Bar */}
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    wizardStep >= s
                      ? "bg-slate-950 shadow-xs"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5 text-xs shadow-2xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="leading-relaxed font-semibold">{error}</div>
          </div>
        )}

        {/* =========================================================================
            STEP 1: SELECT SESSION & SLOTS (Type, Date, Slot, Duration, Guests)
           ========================================================================= */}
        {wizardStep === 1 && !confirmedBooking && (
          <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Header */}
            <div className="text-center space-y-0.5 pt-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                Select Session &amp; Slot
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Book exclusive family session or daytime public swimming
              </p>
            </div>

            {/* Session Type Segmented Cards (Touch Friendly) */}
            <div className="bg-white rounded-3xl p-2 sm:p-2.5 border border-white shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBookingType("FAMILY")}
                  className={`p-3 rounded-2xl text-left transition-all border select-none active:scale-[0.98] ${
                    bookingType === "FAMILY"
                      ? "bg-slate-950 text-white border-slate-950 shadow-md ring-2 ring-cyan-400/30"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                      <ShieldCheck className={`w-3.5 h-3.5 ${bookingType === "FAMILY" ? "text-cyan-300" : "text-[#0284C7]"}`} />
                      <span>Family &amp; Group</span>
                    </span>
                    {bookingType === "FAMILY" && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-1">
                    <span className={`text-[10px] sm:text-[11px] truncate ${bookingType === "FAMILY" ? "text-cyan-200" : "text-slate-500"}`}>
                      Private Pool
                    </span>
                    <span className={`text-xs font-black font-mono shrink-0 ${bookingType === "FAMILY" ? "text-white" : "text-slate-900"}`}>
                      ₹1,500/hr
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBookingType("PUBLIC")}
                  className={`p-3 rounded-2xl text-left transition-all border select-none active:scale-[0.98] ${
                    bookingType === "PUBLIC"
                      ? "bg-slate-950 text-white border-slate-950 shadow-md ring-2 ring-cyan-400/30"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/70"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                      <Waves className={`w-3.5 h-3.5 ${bookingType === "PUBLIC" ? "text-cyan-300" : "text-[#0284C7]"}`} />
                      <span>Public Pool</span>
                    </span>
                    {bookingType === "PUBLIC" && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-1">
                    <span className={`text-[10px] sm:text-[11px] truncate ${bookingType === "PUBLIC" ? "text-cyan-200" : "text-slate-500"}`}>
                      Daytime (9–4)
                    </span>
                    <span className={`text-xs font-black font-mono shrink-0 ${bookingType === "PUBLIC" ? "text-white" : "text-slate-900"}`}>
                      ₹150/person
                    </span>
                  </div>
                </button>
              </div>

              {/* Type Detail Notice */}
              <div className="mt-2 px-3 py-1.5 rounded-xl bg-slate-50 text-[11px] text-slate-600 flex items-center justify-between">
                <span className="truncate pr-2">
                  {isFamily
                    ? "Up to 12 guests included in base rate • 9:00 AM to 11:00 PM"
                    : "Individual access to Main & Kids Pool • 9:00 AM to 4:00 PM"}
                </span>
                <span className="font-bold text-slate-800 font-mono text-[11px] shrink-0">
                  {isFamily ? "₹750 Advance" : "Full Payment"}
                </span>
              </div>
            </div>

            {/* Date Selection Card */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>Choose Date</span>
                </label>
                <span className="text-[11px] font-bold text-[#0284C7] bg-sky-50 px-2.5 py-0.5 rounded-full font-mono">
                  {formatDateLabel(date)}
                </span>
              </div>

              {/* Quick Date 3-Button Row */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setDate(todayIST)}
                  className={`py-2 px-1 rounded-2xl border text-center transition active:scale-95 ${
                    date === todayIST
                      ? "bg-slate-950 text-white border-slate-950 shadow-xs font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                  }`}
                >
                  <div className="text-[10px] text-slate-400 font-medium">Today</div>
                  <div className="text-xs font-bold">{todayIST.split("-")[2]} {formatDateLabel(todayIST).split(" ")[2]}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDate(tomorrowIST)}
                  className={`py-2 px-1 rounded-2xl border text-center transition active:scale-95 ${
                    date === tomorrowIST
                      ? "bg-slate-950 text-white border-slate-950 shadow-xs font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                  }`}
                >
                  <div className="text-[10px] text-slate-400 font-medium">Tomorrow</div>
                  <div className="text-xs font-bold">{tomorrowIST.split("-")[2]} {formatDateLabel(tomorrowIST).split(" ")[2]}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDate(dayAfterIST)}
                  className={`py-2 px-1 rounded-2xl border text-center transition active:scale-95 ${
                    date === dayAfterIST
                      ? "bg-slate-950 text-white border-slate-950 shadow-xs font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                  }`}
                >
                  <div className="text-[10px] text-slate-400 font-medium">Next Day</div>
                  <div className="text-xs font-bold">{dayAfterIST.split("-")[2]} {formatDateLabel(dayAfterIST).split(" ")[2]}</div>
                </button>
              </div>

              {/* Calendar Input for other dates */}
              <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                <span className="text-[11px] font-medium">Other date:</span>
                <input
                  type="date"
                  min={todayIST}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284C7] cursor-pointer"
                />
              </div>
            </div>

            {/* Time Slot Selection Card (3 Columns on Mobile, 4 on Desktop) */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
                  <span>Start Time Slot</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {formatTimeSlot(startTime)}
                </span>
              </div>

              {/* Day/Evening filter for Family */}
              {isFamily && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl text-[11px] font-medium">
                  <button
                    type="button"
                    onClick={() => setSlotFilter("ALL")}
                    className={`flex-1 py-1.5 rounded-xl transition ${slotFilter === "ALL" ? "bg-white text-slate-950 shadow-xs font-bold" : "text-slate-600"}`}
                  >
                    All Slots
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotFilter("DAY")}
                    className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${slotFilter === "DAY" ? "bg-white text-slate-950 shadow-xs font-bold" : "text-slate-600"}`}
                  >
                    <Sun className="w-3 h-3 text-amber-500" />
                    <span>Day (9–4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotFilter("EVENING")}
                    className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1 ${slotFilter === "EVENING" ? "bg-white text-slate-950 shadow-xs font-bold" : "text-slate-600"}`}
                  >
                    <Moon className="w-3 h-3 text-indigo-500" />
                    <span>Evening (4–11)</span>
                  </button>
                </div>
              )}

              {/* Slot Chips Grid: 3 cols on mobile so rows fit compactly! */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
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
                      className={`py-2 px-1 rounded-2xl border text-center transition-all select-none active:scale-95 ${
                        isSelected
                          ? "bg-slate-950 border-slate-950 text-white shadow-md ring-2 ring-cyan-400/30"
                          : isPast
                          ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50"
                          : isBooked
                          ? "border-rose-100 bg-rose-50/70 text-rose-700 cursor-not-allowed"
                          : isHeld
                          ? "border-amber-100 bg-amber-50/70 text-amber-700 cursor-not-allowed"
                          : "border-slate-200/80 bg-white hover:border-slate-400 text-slate-800 hover:shadow-2xs"
                      }`}
                    >
                      <div className={`text-[11px] sm:text-xs font-black font-mono tracking-tight ${isSelected ? "text-white" : ""}`}>
                        {formatTimeSlot(slot)}
                      </div>
                      <div
                        className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mt-0.5 truncate ${
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
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Slot Legend */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Open
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950" /> Selected
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Booked
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Hold
                </span>
              </div>
            </div>

            {/* Duration & Swimmers Combined Card */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-sm space-y-3.5">
              {/* Duration Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Duration</span>
                  </label>
                  <span className="text-[11px] font-medium text-slate-500">
                    Until {formatTimeSlot(endTime)}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
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
                          className={`py-2 px-1 rounded-2xl border text-center transition select-none active:scale-95 ${
                            collides
                              ? "bg-rose-50 border-rose-100 text-rose-400 opacity-60 cursor-not-allowed"
                              : durationHours === h
                              ? "bg-slate-950 text-white border-slate-950 font-bold shadow-xs ring-2 ring-cyan-400/30"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                          }`}
                        >
                          <div className="text-xs font-mono font-bold">{h} {h === 1 ? "Hr" : "Hrs"}</div>
                          <div className={`text-[9px] mt-0.5 truncate ${collides ? "text-rose-500 font-bold" : durationHours === h ? "text-cyan-300" : "text-slate-400"}`}>
                            {collides ? "Collides" : `${h * 60}m`}
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Swimmers Section */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>Guests / Swimmers</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {isFamily ? "Up to 30 Guests" : `Max ${maxCapacity} Swimmers`}
                  </span>
                </div>

                {/* Swimmer Stepper (Finger-Friendly Touch Size) */}
                <div className="flex items-center justify-between bg-slate-100 rounded-2xl p-1.5 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                    className="w-11 h-11 rounded-xl bg-white text-slate-800 font-black hover:bg-slate-50 active:scale-95 shadow-xs flex items-center justify-center text-xl select-none"
                  >
                    –
                  </button>
                  <div className="text-center">
                    <span className="text-2xl font-black font-mono text-slate-950 block leading-tight">
                      {guestCount}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      {guestCount === 1 ? "Person" : "Guests"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGuestCount(Math.min(isFamily ? 30 : maxCapacity, guestCount + 1))}
                    className="w-11 h-11 rounded-xl bg-white text-slate-800 font-black hover:bg-slate-50 active:scale-95 shadow-xs flex items-center justify-center text-xl select-none"
                  >
                    +
                  </button>
                </div>

                {/* Quick Chips (Horizontal Scroll on Mobile) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                  <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Quick:</span>
                  {isFamily ? (
                    [6, 10, 12, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setGuestCount(num)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition shrink-0 active:scale-95 ${
                          guestCount === num ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
                          guestCount === num ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {num}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* STICKY BOTTOM BAR (Always accessible under thumb on mobile) */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] py-3 px-4 pb-safe">
              <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                    {isFamily ? "Advance Payable" : "Total Amount"}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight">
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
                  className="bg-slate-950 hover:bg-slate-800 active:scale-95 text-white font-bold py-3 px-5 sm:px-6 rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 group shrink-0"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: GUEST DETAILS & FINAL REVIEW
           ========================================================================= */}
        {wizardStep === 2 && !confirmedBooking && (
          <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="text-center space-y-0.5 pt-1">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                Review &amp; Guest Details
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Verify booking details and enter contact information
              </p>
            </div>

            {/* Session Summary Card */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">
                  Session Summary
                </span>
                <span className="text-[11px] font-bold text-[#0284C7] bg-sky-50 px-2.5 py-0.5 rounded-full">
                  {isFamily ? "Family & Group (Private)" : "Public Swimming"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Date &amp; Time</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {date} ({formatTimeSlot(startTime)} – {formatTimeSlot(endTime)})
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Guests &amp; Duration</span>
                  <span className="font-bold text-slate-900">
                    {guestCount} Guests ({durationHours} Hour{durationHours > 1 ? "s" : ""})
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Included Access</span>
                  <span className="font-semibold text-emerald-700">
                    Main Pool + Kids Pool Included
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100 font-bold">
                  <span>Total Booking Amount</span>
                  <span className="font-mono text-slate-900">₹{computedTotal}</span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50/70 p-2.5 rounded-2xl border border-emerald-200/80">
                  <span>{isFamily ? "Advance Payment Due Now:" : "Total Payable Now:"}</span>
                  <span className="text-base font-mono font-black">₹{requiredPaymentAmount}</span>
                </div>

                {isFamily && remainingArrivalBalance > 0 && (
                  <p className="text-[11px] text-slate-500 leading-tight">
                    * Balance amount of <strong>₹{remainingArrivalBalance}</strong> is payable at the counter upon arrival (Cash / UPI).
                  </p>
                )}
              </div>
            </div>

            {/* Contact Details Card (Mobile Safari Auto-Zoom Protected with text-base on mobile) */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-sm space-y-3">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0284C7]" />
                <span>Guest Information</span>
              </label>

              <div className="space-y-3">
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
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7] transition"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3 pointer-events-none" />
                  </div>
                </div>

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
                        placeholder="98470XXXXX"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7] transition"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3 pointer-events-none" />
                    </div>
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
                        className="w-full pl-9 pr-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7] transition"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Place / Town Field with Smooth Swipe Carousel */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Place / Town / City <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">e.g. Moonniyur</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter your town (e.g. Moonniyur)"
                      value={customerPlace}
                      onChange={(e) => setCustomerPlace(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7] transition"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 sm:top-3 pointer-events-none" />
                  </div>

                  {/* Quick Nearby Town Swipeable Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 no-scrollbar touch-pan-x">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0">Nearby:</span>
                    {["Moonniyur", "Tirurangadi", "Chelari", "Calicut", "Kondotty", "Parappanangadi", "Kottakkal", "Tanur"].map((town) => (
                      <button
                        key={town}
                        type="button"
                        onClick={() => setCustomerPlace(town)}
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
                    className="w-full px-3.5 py-3 sm:py-2 bg-slate-50 border border-slate-200 rounded-2xl text-base sm:text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0284C7] transition"
                  />
                </div>
              </div>
            </div>

            {/* STICKY BOTTOM BAR FOR STEP 2 */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] py-3 px-4 pb-safe">
              <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="py-3 px-3 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  &larr; Back
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleProceedToPayment}
                  className="bg-slate-950 hover:bg-slate-800 active:scale-95 text-white font-bold py-3 px-5 sm:px-6 rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 group shrink-0"
                >
                  {loading ? (
                    <span>Holding slot...</span>
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
        )}

        {/* =========================================================================
            STEP 3: 15-MINUTE HOLD & SECURE PAYMENT CHECKOUT
           ========================================================================= */}
        {wizardStep === 3 && !confirmedBooking && (
          <div className="space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Live Hold Timer Banner */}
            <div className="bg-slate-950 text-white rounded-3xl p-4 sm:p-5 text-center space-y-1.5 shadow-xl border border-slate-800">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 text-[11px] font-semibold">
                <Timer className="w-3 h-3 text-cyan-400" />
                <span>Slot held for {holdTtlMinutes} minutes</span>
              </div>

              <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-cyan-400 pt-0.5">
                {formatTimer(secondsRemaining)}
              </div>

              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Complete checkout before the timer expires to confirm your reservation.
              </p>
            </div>

            {/* Booking Details Card */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900">
                Payment Review
              </h3>

              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Guest</span>
                  <span className="font-bold text-slate-900">{customerName} ({customerPhone})</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Session</span>
                  <span className="font-bold font-mono text-slate-900">{date} • {formatTimeSlot(startTime)} ({durationHours}h)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Type</span>
                  <span className="font-bold text-slate-900">{isFamily ? "Family & Group" : "Public Swimming"}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span>Amount Due Now:</span>
                  <span className="font-mono font-black text-sm sm:text-base text-emerald-700">₹{requiredPaymentAmount}</span>
                </div>
                {isFamily && remainingArrivalBalance > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Balance on Arrival:</span>
                    <span className="font-mono font-bold text-slate-800">₹{remainingArrivalBalance}</span>
                  </div>
                )}
              </div>

              {/* Payment Method Selector (Touch Friendly 3 Cards) */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("UPI")}
                    className={`py-2.5 px-1.5 rounded-2xl border text-center transition active:scale-95 select-none ${
                      selectedPayMethod === "UPI"
                        ? "bg-slate-950 text-white border-slate-950 font-bold shadow-xs ring-2 ring-cyan-400/30"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-[11px] block">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("CARD")}
                    className={`py-2.5 px-1.5 rounded-2xl border text-center transition active:scale-95 select-none ${
                      selectedPayMethod === "CARD"
                        ? "bg-slate-950 text-white border-slate-950 font-bold shadow-xs ring-2 ring-cyan-400/30"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-[11px] block">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("NETBANKING")}
                    className={`py-2.5 px-1.5 rounded-2xl border text-center transition active:scale-95 select-none ${
                      selectedPayMethod === "NETBANKING"
                        ? "bg-slate-950 text-white border-slate-950 font-bold shadow-xs ring-2 ring-cyan-400/30"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <Lock className="w-4 h-4 mx-auto mb-1" />
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
                  className="w-full bg-slate-950 hover:bg-slate-800 active:scale-95 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 group"
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

        {/* =========================================================================
            DIGITAL BOOKING PASS & RECEIPT (Success State)
           ========================================================================= */}
        {confirmedBooking && (
          <div className="max-w-md mx-auto space-y-3.5 animate-in fade-in zoom-in-95 duration-300">
            {/* Success Header */}
            <div className="text-center space-y-1 pb-1">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                Booking Confirmed!
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
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
