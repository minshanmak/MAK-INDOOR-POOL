"use client";

import React, { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
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
  Share2,
  Navigation,
  MessageCircle,
  User,
  Mail,
  Waves,
  Heart,
  ChevronDown,
} from "lucide-react";
import { getPoolDate, getPoolHour, POOL_TIMEZONE } from "@/lib/timezone";

function BookingContent() {
  const searchParams = useSearchParams();
  const paramType = searchParams.get("type")?.toUpperCase();
  const initialType: "PUBLIC" | "FAMILY" =
    paramType === "PUBLIC" ? "PUBLIC" : "FAMILY";

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

  // Payment method selection in Step 2
  const [paymentOption, setPaymentOption] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");

  // Step Tracker: 1 = Form & Summary, 2 = Checkout & Hold Timer, 3 = Receipt Pass
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server-Authoritative State
  const [availResult, setAvailResult] = useState<any>(null);
  const [daySlots, setDaySlots] = useState<
    Record<string, { status: string; reason?: string; remainingCapacity?: number }>
  >({});
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [customDatePickerOpen, setCustomDatePickerOpen] = useState(false);

  // Pool Timezone helper values (Asia/Kolkata)
  const todayIST = useMemo(() => getPoolDate(), []);
  const tomorrowIST = useMemo(() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return getPoolDate(d);
  }, []);
  const currentISTHour = useMemo(() => getPoolHour(), []);

  // Quick Date Chips (Mobile friendly 1-tap selectors)
  const quickDateChips = useMemo(() => {
    const chips = [];
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = getPoolDate(d);
      const label =
        i === 0
          ? "Today"
          : i === 1
          ? "Tomorrow"
          : new Intl.DateTimeFormat("en-IN", {
              timeZone: POOL_TIMEZONE,
              weekday: "short",
            }).format(d);
      const subLabel = new Intl.DateTimeFormat("en-IN", {
        timeZone: POOL_TIMEZONE,
        day: "numeric",
        month: "short",
      }).format(d);
      chips.push({ dateStr, label, subLabel });
    }
    return chips;
  }, []);

  // Synchronize with URL search parameter if changed
  useEffect(() => {
    if (paramType === "PUBLIC" || paramType === "FAMILY") {
      setBookingType(paramType);
    }
  }, [paramType]);

  // Handle switching between PUBLIC and FAMILY with sensible smart defaults
  useEffect(() => {
    if (bookingType === "PUBLIC") {
      if (currentISTHour >= 16) {
        setDate(tomorrowIST);
        setStartTime("09:00");
      } else {
        setDate(todayIST);
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
      if (currentISTHour >= 22) {
        setDate(tomorrowIST);
        setStartTime("16:00");
      } else {
        setDate(todayIST);
        if (currentISTHour >= 9 && currentISTHour < 22) {
          setStartTime(`${String(currentISTHour + 1).padStart(2, "0")}:00`);
        } else {
          setStartTime("16:00");
        }
      }
      setGuestCount(8);
      setDurationHours(1);
    }
  }, [bookingType, todayIST, tomorrowIST, currentISTHour]);

  // Fetch slot availability for selected date and session type
  useEffect(() => {
    if (!date) return;
    let isCancelled = false;

    const fetchDaySlots = async () => {
      try {
        const res = await fetch(
          `/api/availability?date=${encodeURIComponent(
            date
          )}&type=${encodeURIComponent(bookingType)}`
        );
        const json = await res.json();
        if (!isCancelled && json.slots) {
          setDaySlots(json.slots);
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

  // Real-time countdown for 15-minute slot hold
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

  // Auto-clamp duration when slot changes or if it collides with a booked slot
  useEffect(() => {
    if (durationHours > maxAllowedHours) {
      setDurationHours(maxAllowedHours);
    }
  }, [startTime, maxAllowedHours, durationHours]);

  // Helper to check if any intermediate hour in the selected duration is booked
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
            if (data.slots) {
              setDaySlots(data.slots);
            }
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
  const familyDaySlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
  const familyEveningSlots = [
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
  ];
  const activeSlots =
    bookingType === "PUBLIC" ? publicSlots : [...familyDaySlots, ...familyEveningSlots];

  // Check if slot has already concluded today in IST
  const isSlotPastToday = (slot: string) => {
    if (date !== todayIST) return false;
    const [slotH] = slot.split(":").map(Number);
    return slotH <= currentISTHour;
  };

  // Auto-select first available slot if currently selected is invalid on date change
  useEffect(() => {
    if (!daySlots || Object.keys(daySlots).length === 0) return;
    const currentStatus = daySlots[startTime]?.status;
    if (
      currentStatus === "BOOKED" ||
      currentStatus === "HELD" ||
      currentStatus === "PAST"
    ) {
      const firstAvail = activeSlots.find(
        (s) => daySlots[s]?.status === "AVAILABLE" && !isSlotPastToday(s)
      );
      if (firstAvail) {
        setStartTime(firstAvail);
      }
    }
  }, [daySlots, startTime, activeSlots, date]);

  // Step 1 to Step 2: Request 15-Minute Slot Hold
  const handleProceedToPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!availResult?.available) {
      setError(
        availResult?.reason || "This slot is not available. Please choose another time."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Please provide your Name and 10-digit Mobile Number.");
      window.scrollTo({ top: 300, behavior: "smooth" });
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
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
        throw new Error(
          data.error || "Failed to hold slot. It may have just been booked by another guest."
        );
      }

      setHoldToken(data.holdToken);
      setHoldExpiresAt(new Date(data.expiresAt));
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
  const clientBaseTotal = isFamily
    ? 1500 * durationHours
    : 150 * guestCount * durationHours;
  const clientComputedTotal = clientBaseTotal + extraGuestFee;

  // Authoritative server total or client fallback
  const computedTotal = availResult?.pricing?.totalPrice ?? clientComputedTotal;

  // Business Rule: Public swimming requires 100% full online payment.
  // Family booking requires configured advance (default ₹750).
  const requiredPaymentAmount = isFamily
    ? availResult?.pricing?.advanceRequired ?? 750
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
          paymentMethod: paymentOption === "UPI" ? "UPI" : "GATEWAY",
          initialAmount: requiredPaymentAmount,
          transactionRef: `MAK-TRX-${Date.now()}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm booking.");
      }

      setConfirmedBooking(data.booking);
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message || "Payment verification failed. Please try again.");
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

  // Generate WhatsApp ticket text for sharing
  const getWhatsAppShareUrl = () => {
    if (!confirmedBooking) return "#";
    const text = `🏊 *M.A.K Indoor Pool - Booking Confirmed!*\n\n` +
      `🎟️ *Reference ID:* ${confirmedBooking.id}\n` +
      `👤 *Guest Name:* ${confirmedBooking.customerName}\n` +
      `📅 *Date:* ${confirmedBooking.bookingDate}\n` +
      `⏰ *Time Slot:* ${formatTimeSlot(confirmedBooking.startTime)} – ${formatTimeSlot(confirmedBooking.endTime)}\n` +
      `👥 *Guests:* ${confirmedBooking.guestCount} (${confirmedBooking.type === "FAMILY" ? "Family Exclusive" : "Public Swimming"})\n` +
      `💳 *Paid Online:* ₹${confirmedBooking.totalPaid}\n` +
      `💵 *Balance on Arrival:* ₹${confirmedBooking.balanceAmount}\n\n` +
      `📍 *Location:* M.A.K Indoor Pool, Kalathingalpara, Moonniyur, Kerala\n` +
      `🗺️ *Google Maps:* https://maps.google.com/?q=M.A.K+Indoor+Pool+Moonniyur`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-[#F0F5FA] text-slate-800 pb-32 sm:pb-24">
      {/* Top Banner / Mobile Nav Anchor */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-slate-200/80 sticky top-[70px] z-30 transition-all">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>

          {/* 3-Step Guided Progress Pill */}
          <div className="flex items-center gap-2 text-[11px] font-bold">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                step === 1
                  ? "bg-slate-950 text-white shadow-xs"
                  : "text-slate-400 bg-slate-100"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                1
              </span>
              <span className="hidden sm:inline">Select Slot</span>
              <span className="sm:hidden">Slot</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                step === 2
                  ? "bg-slate-950 text-white shadow-xs"
                  : step > 2
                  ? "text-emerald-700 bg-emerald-50"
                  : "text-slate-400 bg-slate-100"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Checkout</span>
            </div>

            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                step === 3
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-400 bg-slate-100"
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Pass</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-6 sm:space-y-8">
        {/* Error / Alert Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 text-xs shadow-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="leading-relaxed font-medium">{error}</div>
          </div>
        )}

        {/* =========================================================================
            STEP 1: INTUITIVE MOBILE-FIRST SLOT & DETAILS SELECTION
           ========================================================================= */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Mobile Guided Experience */}
            <div className="lg:col-span-7 space-y-6">
              {/* Header Title & Pitch */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">
                  Instant Online Booking
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  Book Your Swimming Slot
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select your session type, pick your date, and reserve your pool time instantly.
                </p>
              </div>

              {/* 1. INTERACTIVE EXPERIENCE CARDS (Mobile-First 2-Option Card Grid) */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Step 1 • Choose Experience
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option A: Family Exclusive */}
                  <button
                    type="button"
                    onClick={() => setBookingType("FAMILY")}
                    className={`relative p-4 rounded-2xl text-left border-2 transition-all duration-200 active:scale-[0.99] flex flex-col justify-between ${
                      bookingType === "FAMILY"
                        ? "border-slate-950 bg-white shadow-md ring-2 ring-slate-950/5"
                        : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white shadow-xs"
                    }`}
                  >
                    {bookingType === "FAMILY" && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
                          👨‍👩‍👧‍👦
                        </span>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">
                            Family Exclusive
                          </h3>
                          <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            100% Private Pool
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                        Entire pool locked exclusively for your family. Zero outside visitors.
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <div>
                        <span className="text-base font-black text-slate-950 font-mono">
                          ₹1,500
                        </span>
                        <span className="text-[11px] text-slate-500"> / hour</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        ₹750 Advance to book
                      </span>
                    </div>
                  </button>

                  {/* Option B: Public Swimming */}
                  <button
                    type="button"
                    onClick={() => setBookingType("PUBLIC")}
                    className={`relative p-4 rounded-2xl text-left border-2 transition-all duration-200 active:scale-[0.99] flex flex-col justify-between ${
                      bookingType === "PUBLIC"
                        ? "border-slate-950 bg-white shadow-md ring-2 ring-slate-950/5"
                        : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white shadow-xs"
                    }`}
                  >
                    {bookingType === "PUBLIC" && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-sky-100 text-[#0284C7] flex items-center justify-center text-sm font-bold">
                          🏊
                        </span>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">
                            Public Swimming
                          </h3>
                          <span className="text-[10px] font-semibold text-[#0284C7] bg-sky-50 px-1.5 py-0.5 rounded">
                            Daytime (9 AM – 4 PM)
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                        Individual &amp; group shared swimming. Capped at 25 swimmers max.
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <div>
                        <span className="text-base font-black text-slate-950 font-mono">
                          ₹150
                        </span>
                        <span className="text-[11px] text-slate-500"> / person / hr</span>
                      </div>
                      <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full">
                        Full online payment
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. QUICK DATE CHIPS (Instant 1-Tap Mobile Selection) */}
              <div className="space-y-2.5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Step 2 • Select Date
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomDatePickerOpen(!customDatePickerOpen)}
                    className="text-[11px] font-semibold text-[#1D68BD] hover:underline flex items-center gap-1"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>{customDatePickerOpen ? "Hide Calendar" : "Pick Other Date"}</span>
                  </button>
                </div>

                {/* 4 Quick Date Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {quickDateChips.map((chip) => {
                    const isSelected = date === chip.dateStr;
                    return (
                      <button
                        key={chip.dateStr}
                        type="button"
                        onClick={() => {
                          setDate(chip.dateStr);
                          setCustomDatePickerOpen(false);
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all duration-150 active:scale-95 ${
                          isSelected
                            ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200/90"
                        }`}
                      >
                        <div
                          className={`text-xs font-extrabold ${
                            isSelected ? "text-white" : "text-slate-900"
                          }`}
                        >
                          {chip.label}
                        </div>
                        <div
                          className={`text-[10px] font-medium mt-0.5 ${
                            isSelected ? "text-cyan-300" : "text-slate-500"
                          }`}
                        >
                          {chip.subLabel}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Native Date Picker Dropdown */}
                {customDatePickerOpen && (
                  <div className="pt-2 animate-fadeIn">
                    <input
                      type="date"
                      min={todayIST}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950"
                    />
                  </div>
                )}
              </div>

              {/* 3. GROUPED TIME SLOT SELECTOR */}
              <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Step 3 • Select Start Time
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Selected: <strong className="text-slate-950">{formatTimeSlot(startTime)}</strong>
                  </span>
                </div>

                {/* Slot Helper Badge */}
                {isFamily && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Exclusive pool sessions available from 9 AM to 11 PM</span>
                  </div>
                )}

                {/* Family Evening Group */}
                {isFamily && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span className="flex items-center gap-1.5 text-purple-900">
                        <span>🌙 Evening &amp; Night Sessions (4 PM – 11 PM)</span>
                        <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded text-[9px]">
                          ⭐ Popular
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {familyEveningSlots.map((slot) => {
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
                              const [sH] = slot.split(":").map(Number);
                              const allowed = Math.max(1, Math.min(4, sessionEndHour - sH));
                              if (durationHours > allowed) {
                                setDurationHours(allowed);
                              }
                            }}
                            className={`min-h-[50px] p-2 rounded-xl border text-center transition-all duration-150 active:scale-95 flex flex-col justify-center items-center ${
                              isPast
                                ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50"
                                : isBooked
                                ? "border-rose-200 bg-rose-50/80 text-rose-800 cursor-not-allowed"
                                : isHeld
                                ? "border-amber-200 bg-amber-50 text-amber-800 cursor-not-allowed"
                                : isSelected
                                ? "border-slate-950 bg-slate-950 text-white shadow-md ring-2 ring-slate-950/20"
                                : "border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-400 text-slate-800"
                            }`}
                          >
                            <span className="text-xs font-bold font-mono">
                              {formatTimeSlot(slot)}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                                isSelected
                                  ? "text-cyan-300"
                                  : isBooked
                                  ? "text-rose-600"
                                  : isHeld
                                  ? "text-amber-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              {isPast
                                ? "Past"
                                : isBooked
                                ? "Booked"
                                : isHeld
                                ? "In Checkout"
                                : isSelected
                                ? "Selected"
                                : "Available"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Daytime Group */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-slate-600">
                    ☀️ Daytime Sessions (9 AM – 4 PM)
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(isFamily ? familyDaySlots : publicSlots).map((slot) => {
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
                            const [sH] = slot.split(":").map(Number);
                            const allowed = Math.max(1, Math.min(4, sessionEndHour - sH));
                            if (durationHours > allowed) {
                              setDurationHours(allowed);
                            }
                          }}
                          className={`min-h-[50px] p-2 rounded-xl border text-center transition-all duration-150 active:scale-95 flex flex-col justify-center items-center ${
                            isPast
                              ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50"
                              : isBooked
                              ? "border-rose-200 bg-rose-50/80 text-rose-800 cursor-not-allowed"
                              : isHeld
                              ? "border-amber-200 bg-amber-50 text-amber-800 cursor-not-allowed"
                              : isSelected
                              ? "border-slate-950 bg-slate-950 text-white shadow-md ring-2 ring-slate-950/20"
                              : "border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-400 text-slate-800"
                          }`}
                        >
                          <span className="text-xs font-bold font-mono">
                            {formatTimeSlot(slot)}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                              isSelected
                                ? "text-cyan-300"
                                : isBooked
                                ? "text-rose-600"
                                : isHeld
                                ? "text-amber-600"
                                : "text-emerald-700"
                            }`}
                          >
                            {isPast
                              ? "Past"
                              : isBooked
                              ? "Booked"
                              : isHeld
                              ? "In Checkout"
                              : isSelected
                              ? "Selected"
                              : bookingType === "PUBLIC" &&
                                slotInfo?.remainingCapacity !== undefined &&
                                slotInfo.remainingCapacity < 10
                              ? `${slotInfo.remainingCapacity} Left`
                              : "Available"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Visual Legend */}
                <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Booked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> In Checkout
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-300" /> Past
                  </span>
                </div>
              </div>

              {/* 4. GUESTS & DURATION (Thumb-Friendly Controls) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Guest Counter */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Guests / Swimmers
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {isFamily ? "Max 30" : "Max 25"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border border-slate-200 rounded-xl bg-slate-50 p-1.5">
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-800 font-black hover:bg-slate-100 flex items-center justify-center text-lg active:scale-90 transition"
                      aria-label="Decrease guest count"
                    >
                      –
                    </button>
                    <div className="text-center">
                      <span className="text-lg font-black text-slate-950 font-mono">
                        {guestCount}
                      </span>
                      <span className="text-[10px] text-slate-500 block font-semibold">
                        {guestCount === 1 ? "Swimmer" : "Swimmers"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setGuestCount(Math.min(isFamily ? 30 : 25, guestCount + 1))
                      }
                      className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-800 font-black hover:bg-slate-100 flex items-center justify-center text-lg active:scale-90 transition"
                      aria-label="Increase guest count"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {isFamily
                      ? "12 guests included in base rate. ₹100/extra guest."
                      : "₹150 per person per hour."}
                  </span>
                </div>

                {/* Duration Pills */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Duration
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Ends at {formatTimeSlot(endTime)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[1, 2, 3]
                      .filter((h) => h <= maxAllowedHours && !isDurationColliding(startTime, h))
                      .map((h) => {
                        const isSelected = durationHours === h;
                        return (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setDurationHours(h)}
                            className={`p-2.5 rounded-xl border text-center transition-all duration-150 active:scale-95 ${
                              isSelected
                                ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                            }`}
                          >
                            <span className="block text-xs font-extrabold font-mono">
                              {h} Hr{h > 1 ? "s" : ""}
                            </span>
                            <span
                              className={`text-[9px] block ${
                                isSelected ? "text-cyan-300" : "text-slate-500"
                              }`}
                            >
                              until {formatTimeSlot(getEndTime(startTime, h))}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* 5. GUEST CONTACT DETAILS (iOS Friendly Input Fields) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Step 4 • Contact Information
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Minshad K"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      10-Digit Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="tel"
                        inputMode="numeric"
                        required
                        placeholder="98470XXXXX"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Email Address (Optional, for ticket copy)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Desktop Sticky Glass Summary Card */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
              <div className="bg-white/90 backdrop-blur-2xl rounded-3xl border border-white p-5 sm:p-6 shadow-[0_8px_30px_rgba(20,60,110,0.06)] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-extrabold text-slate-950">
                    Booking Summary
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
                    Live Calculation
                  </span>
                </div>

                {/* Clean Key-Value Pairs */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Experience:</span>
                    <span className="font-bold text-slate-900">
                      {isFamily ? "Family Exclusive (Private)" : "Public Swimming"}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Date:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {date}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Time:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatTimeSlot(startTime)} – {formatTimeSlot(endTime)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Duration &amp; Swimmers:</span>
                    <span className="font-bold text-slate-900">
                      {durationHours} Hr{durationHours > 1 ? "s" : ""} • {guestCount} Guests
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                  {isFamily ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>
                          Base Rate ({durationHours} hr{durationHours > 1 ? "s" : ""}, up to 12)
                        </span>
                        <span className="font-mono font-semibold text-slate-900">
                          ₹{1500 * durationHours}
                        </span>
                      </div>
                      {extraGuests > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>
                            Extra Guests ({extraGuests} &times; ₹100/hr)
                          </span>
                          <span className="font-mono font-semibold text-slate-900">
                            ₹{extraGuestFee}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>
                        Public Swimming ({guestCount} swimmers &times; {durationHours} hr)
                      </span>
                      <span className="font-mono font-semibold text-slate-900">
                        ₹{computedTotal}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-baseline font-black text-sm text-slate-950 pt-2 border-t border-slate-100">
                    <span>Total Session Value</span>
                    <span className="font-mono text-base">₹{computedTotal}</span>
                  </div>
                </div>

                {/* Advance vs Counter Balance Box */}
                {isFamily ? (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-black text-amber-950">
                      <span>Payable Online (Advance):</span>
                      <span className="text-lg font-mono">₹{requiredPaymentAmount}</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-tight">
                      Remaining ₹{remainingArrivalBalance} payable upon arrival at counter (Cash / UPI).
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-black text-emerald-950">
                      <span>Payable Online (Full):</span>
                      <span className="text-lg font-mono">₹{requiredPaymentAmount}</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-tight">
                      100% online admission. Zero balance due on arrival.
                    </p>
                  </div>
                )}

                {/* Desktop Action Button */}
                <button
                  type="button"
                  disabled={loading || (availResult && !availResult.available)}
                  onClick={() => handleProceedToPayment()}
                  className={`w-full font-black py-4 rounded-full text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-98 ${
                    availResult && !availResult.available
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                      : "bg-slate-950 hover:bg-slate-800 text-white shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                  }`}
                >
                  {loading ? (
                    <span>Holding Slot...</span>
                  ) : availResult && !availResult.available ? (
                    <span>Slot Unavailable</span>
                  ) : (
                    <>
                      <span>Proceed to Hold &amp; Pay (₹{requiredPaymentAmount})</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-tight">
                  🔒 Holds your slot exclusively for 15 minutes while completing payment.
                </p>
              </div>

              {/* Guarantees Box */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/70 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Pool Safety &amp; Cancellation Assurance</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Cancel up to 2 hours prior for a full instant refund. 100% sanitized hospital-grade water.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: 15-MINUTE HOLD CHECKOUT & INSTANT PAYMENT SIMULATION
           ========================================================================= */}
        {step === 2 && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-cyan-700 bg-cyan-50 px-3 py-1 rounded-full">
                Slot Temporarily Reserved
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                {isFamily ? "Pay Advance to Confirm" : "Complete Online Admission"}
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your pool slot is held exclusively for you. Complete payment verification before the timer ends.
              </p>
            </div>

            {/* Glowing 15-Minute Countdown Timer */}
            <div className="p-5 rounded-2xl bg-slate-950 text-white text-center space-y-1 shadow-md">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                Holding Time Remaining
              </span>
              <div className="text-4xl font-black font-mono tracking-widest text-cyan-400 animate-pulse">
                {formatTimer(secondsRemaining)}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Slot auto-releases if transaction is not confirmed within 15:00
              </span>
            </div>

            {/* Review Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Guest:</span>
                <span className="font-bold text-slate-900">
                  {customerName} ({customerPhone})
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Session:</span>
                <span className="font-mono font-bold text-slate-900">
                  {date} • {formatTimeSlot(startTime)} – {formatTimeSlot(endTime)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Type &amp; Guests:</span>
                <span className="font-bold text-slate-900">
                  {isFamily ? "Family Exclusive" : "Public Swimming"} ({guestCount} Guests)
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-900">Payable Now Online:</span>
                <span className="font-mono font-black text-emerald-700 text-base">
                  ₹{requiredPaymentAmount}
                </span>
              </div>
              {isFamily && remainingArrivalBalance > 0 && (
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Balance Due on Arrival:</span>
                  <span className="font-mono font-bold text-slate-800">
                    ₹{remainingArrivalBalance}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Select Payment Mode
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentOption("UPI")}
                  className={`p-3 rounded-xl border text-center transition ${
                    paymentOption === "UPI"
                      ? "border-slate-950 bg-slate-950 text-white font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-700 font-semibold"
                  }`}
                >
                  <span className="block text-xs">UPI / QR</span>
                  <span className="text-[9px] opacity-75">GPay • PhonePe</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentOption("CARD")}
                  className={`p-3 rounded-xl border text-center transition ${
                    paymentOption === "CARD"
                      ? "border-slate-950 bg-slate-950 text-white font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-700 font-semibold"
                  }`}
                >
                  <span className="block text-xs">Card</span>
                  <span className="text-[9px] opacity-75">Debit • Credit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentOption("NETBANKING")}
                  className={`p-3 rounded-xl border text-center transition ${
                    paymentOption === "NETBANKING"
                      ? "border-slate-950 bg-slate-950 text-white font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-700 font-semibold"
                  }`}
                >
                  <span className="block text-xs">NetBanking</span>
                  <span className="text-[9px] opacity-75">All Banks</span>
                </button>
              </div>
            </div>

            {/* Pay Button */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleCompletePayment}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white font-black py-4 rounded-full text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Authorizing Gateway Payment...</span>
                ) : (
                  <>
                    <span>Pay ₹{requiredPaymentAmount} &amp; Confirm Booking</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
              >
                &larr; Modify Slot Configuration
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: PRINTABLE DIGITAL TICKET PASS & WHATSAPP SHARE
           ========================================================================= */}
        {step === 3 && confirmedBooking && (
          <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
            {/* Success Celebration Card */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-md animate-bounce">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h2 className="text-2xl font-black text-slate-950">
                Booking Confirmed!
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your pool slot has been permanently locked in our system. Show this pass on arrival.
              </p>
            </div>

            {/* Digital Passbook Ticket Card */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg">
              {/* Ticket Top Rim */}
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">
                    Confirmed Reservation ID
                  </span>
                  <span className="text-xl font-mono font-black">
                    {confirmedBooking.id}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(confirmedBooking.id)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-mono font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCode ? "Copied" : "Copy"}</span>
                </button>
              </div>

              {/* Ticket Body */}
              <div className="p-5 sm:p-6 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Customer
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {confirmedBooking.customerName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Session Type
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {confirmedBooking.type === "FAMILY"
                        ? "Exclusive Family"
                        : "Public Swimming"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Date
                    </span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {confirmedBooking.bookingDate}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Time Slot
                    </span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {formatTimeSlot(confirmedBooking.startTime)} –{" "}
                      {formatTimeSlot(confirmedBooking.endTime)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Paid Online
                    </span>
                    <span className="font-bold text-emerald-700 font-mono text-sm">
                      ₹{confirmedBooking.totalPaid}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      Balance on Arrival
                    </span>
                    <span className="font-bold text-slate-900 font-mono text-sm">
                      {confirmedBooking.balanceAmount > 0
                        ? `₹${confirmedBooking.balanceAmount}`
                        : "₹0 (Paid in Full)"}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 flex items-start gap-2.5 text-[11px] text-slate-600">
                  <MapPin className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>M.A.K Indoor Swimming Pool</strong>, Kalathingalpara, Moonniyur, Malappuram, Kerala.
                  </span>
                </div>
              </div>

              {/* Action Buttons inside Ticket */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                <a
                  href={getWhatsAppShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-full text-xs text-center flex items-center justify-center gap-2 shadow-xs transition active:scale-98"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share via WhatsApp</span>
                </a>

                <a
                  href="https://maps.google.com/?q=M.A.K+Indoor+Pool+Moonniyur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-slate-950 hover:bg-slate-800 text-white font-bold py-3 rounded-full text-xs text-center flex items-center justify-center gap-2 shadow-xs transition active:scale-98"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Directions (Google Maps)</span>
                </a>
              </div>
            </div>

            {/* Secondary Controls */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 border border-slate-300 hover:bg-white text-slate-800 font-bold py-3 rounded-full text-xs text-center flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print Ticket</span>
              </button>

              <Link
                href="/"
                className="flex-1 border border-slate-300 hover:bg-white text-slate-800 font-bold py-3 rounded-full text-xs text-center transition flex items-center justify-center"
              >
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MOBILE STICKY BOTTOM ACTION BAR (Thumb-Friendly Instant Booking)
         ========================================================================= */}
      {step === 1 && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/90 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {isFamily ? "Advance Payable" : "Admission Total"}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-950 font-mono">
                  ₹{requiredPaymentAmount}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  • {durationHours} hr • {formatTimeSlot(startTime)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading || (availResult && !availResult.available)}
              onClick={() => handleProceedToPayment()}
              className={`px-6 py-3.5 rounded-full font-black text-xs shadow-md transition flex items-center gap-1.5 active:scale-95 ${
                availResult && !availResult.available
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-slate-950 text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
              }`}
            >
              {loading ? (
                <span>Holding...</span>
              ) : availResult && !availResult.available ? (
                <span>Unavailable</span>
              ) : (
                <>
                  <span>Book Now</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookNowPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-500 font-mono text-xs">
          Loading booking engine...
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
