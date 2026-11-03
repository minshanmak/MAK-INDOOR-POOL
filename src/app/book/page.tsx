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
  ChevronLeft,
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  MapPin,
  Phone,
  HelpCircle,
  Info,
  Sparkles,
  Share2,
  User,
  Mail,
  FileText,
  Smartphone,
  Waves,
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

  // Time Slot Filter Tab on Mobile (All vs Daytime vs Evening)
  const [slotFilter, setSlotFilter] = useState<"ALL" | "DAY" | "EVENING">("ALL");

  // Customer Contact Info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Payment Method choice in Step 2 (Simulated)
  const [selectedPayMethod, setSelectedPayMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");

  // Step Tracker: 1 = Form & Summary, 2 = Checkout & Hold Timer, 3 = Receipt
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Server-Authoritative State
  const [availResult, setAvailResult] = useState<any>(null);
  const [daySlots, setDaySlots] = useState<Record<string, { status: string; reason?: string; remainingCapacity?: number }>>({});
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<Date | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

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

  // Format date helper for quick pills (e.g. "Mon, 3 Nov")
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

  // Handle switching between PUBLIC and FAMILY
  useEffect(() => {
    if (bookingType === "PUBLIC") {
      // If today and daytime public hours (09:00 - 16:00) have finished, default date to tomorrow
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
  const familySlots = [
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
    "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"
  ];
  const allSlots = bookingType === "PUBLIC" ? publicSlots : familySlots;

  // Filtered slots based on time of day
  const activeSlots = useMemo(() => {
    if (bookingType === "PUBLIC" || slotFilter === "ALL") return allSlots;
    if (slotFilter === "DAY") {
      return allSlots.filter((s) => Number(s.split(":")[0]) < 16);
    }
    // EVENING
    return allSlots.filter((s) => Number(s.split(":")[0]) >= 16);
  }, [allSlots, bookingType, slotFilter]);

  // Check if slot has already concluded today
  const isSlotPastToday = (slot: string) => {
    if (date !== todayIST) return false;
    const [slotH] = slot.split(":").map(Number);
    return slotH <= currentISTHour;
  };

  // If currently selected slot is booked/held/past on newly loaded date, auto-select first available slot
  useEffect(() => {
    if (!daySlots || Object.keys(daySlots).length === 0) return;
    const currentStatus = daySlots[startTime]?.status;
    if (currentStatus === "BOOKED" || currentStatus === "HELD" || currentStatus === "PAST") {
      const firstAvail = activeSlots.find((s) => daySlots[s]?.status === "AVAILABLE");
      if (firstAvail) {
        setStartTime(firstAvail);
      }
    }
  }, [daySlots, startTime, activeSlots]);

  // Step 1 to Step 2: Request 15-Minute Slot Hold
  const handleProceedToPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!availResult?.available) {
      setError(availResult?.reason || "This slot is not available. Please choose another time.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Please provide your Name and 10-digit Mobile Number.");
      // Scroll to contact section on mobile
      const contactEl = document.getElementById("contact-section");
      if (contactEl) contactEl.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (customerPhone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit Indian phone number.");
      const contactEl = document.getElementById("contact-section");
      if (contactEl) contactEl.scrollIntoView({ behavior: "smooth" });
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
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  const handleShareWhatsApp = (booking: any) => {
    const text = `🏊 *M.A.K INDOOR POOL BOOKING CONFIRMATION*\n\n` +
      `*Pass ID:* ${booking.id}\n` +
      `*Type:* ${booking.type === "FAMILY" ? "Exclusive Family Slot" : "Public Swimming"}\n` +
      `*Date:* ${booking.bookingDate}\n` +
      `*Time:* ${formatTimeSlot(booking.startTime)} – ${formatTimeSlot(booking.endTime)}\n` +
      `*Swimmers:* ${booking.guestCount} Guests\n` +
      `*Paid Online:* ₹${booking.totalPaid}\n` +
      (booking.balanceAmount > 0 ? `*Balance Due at Arrival:* ₹${booking.balanceAmount}\n` : `*Status:* Paid in Full\n`) +
      `\n📍 Location: Kalathingalpara, Moonniyur, Malappuram, Kerala\n` +
      `📞 Helpline: +91 98470 12345`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const formatTimer = (totalSeconds: number | null) => {
    if (totalSeconds === null) return "15:00";
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#F0F5FA] text-slate-800 pb-28 lg:pb-16 pt-3 sm:pt-6 selection:bg-cyan-500 selection:text-white">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">

        {/* =========================================================================
            TOP iOS NAVIGATION HEADER WITH BREADCRUMB
           ========================================================================= */}
        <div className="flex items-center justify-between pt-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 bg-white/70 hover:bg-white backdrop-blur-xl border border-white px-3 py-1.5 rounded-full shadow-2xs transition active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>

          {/* iOS Progressive Step Dots */}
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-white px-3.5 py-1.5 rounded-full shadow-2xs text-[11px] font-bold">
            <span className={`w-2 h-2 rounded-full transition-all ${step >= 1 ? "bg-cyan-500 ring-2 ring-cyan-200" : "bg-slate-300"}`} />
            <span className={step === 1 ? "text-slate-900" : "text-slate-400"}>1. Configure</span>
            <span className="text-slate-300">•</span>
            <span className={`w-2 h-2 rounded-full transition-all ${step >= 2 ? "bg-cyan-500 ring-2 ring-cyan-200" : "bg-slate-300"}`} />
            <span className={step === 2 ? "text-slate-900" : "text-slate-400"}>2. Hold</span>
            <span className="text-slate-300">•</span>
            <span className={`w-2 h-2 rounded-full transition-all ${step === 3 ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-slate-300"}`} />
            <span className={step === 3 ? "text-emerald-700 font-extrabold" : "text-slate-400"}>3. Pass</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Reserve Your Pool Slot
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Hospital-grade hygiene • Temperature controlled • 100% private during family slots
          </p>
        </div>

        {/* =========================================================================
            iOS SEGMENTED CONTROL: PUBLIC SWIMMING vs FAMILY EXCLUSIVE
           ========================================================================= */}
        {step === 1 && (
          <div className="max-w-md mx-auto">
            <div className="relative p-1 bg-slate-200/65 backdrop-blur-2xl rounded-full border border-white/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] grid grid-cols-2 gap-1 select-none">
              <button
                type="button"
                onClick={() => setBookingType("PUBLIC")}
                className={`relative py-2.5 px-3 rounded-full text-xs font-bold transition-all duration-200 flex flex-col items-center justify-center ${
                  bookingType === "PUBLIC"
                    ? "bg-white text-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)]"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <span>🏊 Public Swimming</span>
                <span className="text-[10px] opacity-75 font-normal">9 AM – 4 PM • ₹150/hr</span>
              </button>

              <button
                type="button"
                onClick={() => setBookingType("FAMILY")}
                className={`relative py-2.5 px-3 rounded-full text-xs font-bold transition-all duration-200 flex flex-col items-center justify-center ${
                  bookingType === "FAMILY"
                    ? "bg-white text-slate-950 shadow-[0_2px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)]"
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <span>👨‍👩‍👧‍👦 Family Exclusive</span>
                <span className="text-[10px] opacity-75 font-normal">9 AM – 11 PM • 100% Private</span>
              </button>
            </div>
          </div>
        )}

        {/* Alerts & Notifications */}
        {error && (
          <div className="max-w-xl mx-auto p-3.5 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-900 flex items-start gap-2.5 text-xs shadow-2xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="leading-relaxed font-semibold">{error}</div>
          </div>
        )}

        {step === 1 && availResult && !availResult.available && !error && (
          <div className="max-w-xl mx-auto p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs shadow-2xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Slot Unavailable:</strong> {availResult.reason}
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 1: MAIN BOOKING WORKFLOW (Mobile-First iOS Card Experience)
           ========================================================================= */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
            {/* Left Main Column: iOS Inset Form Cards */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">

              {/* CARD 1: DATE SELECTION (Quick 1-Tap Pills for Mobile) */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 border border-white shadow-[0_4px_24px_rgba(20,60,110,0.05)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      1. Choose Date
                    </label>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full">
                    {formatDateLabel(date)}
                  </span>
                </div>

                {/* Mobile Quick-Date Selector Pills */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDate(todayIST)}
                    className={`py-2 px-1 rounded-2xl text-center border transition active:scale-95 ${
                      date === todayIST
                        ? "bg-slate-950 text-white border-slate-950 shadow-xs font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <div className="text-[10px] opacity-75 uppercase">Today</div>
                    <div className="text-xs">{todayIST.split("-")[2]} {formatDateLabel(todayIST).split(" ")[2]}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDate(tomorrowIST)}
                    className={`py-2 px-1 rounded-2xl text-center border transition active:scale-95 ${
                      date === tomorrowIST
                        ? "bg-slate-950 text-white border-slate-950 shadow-xs font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <div className="text-[10px] opacity-75 uppercase">Tomorrow</div>
                    <div className="text-xs">{tomorrowIST.split("-")[2]} {formatDateLabel(tomorrowIST).split(" ")[2]}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDate(dayAfterIST)}
                    className={`py-2 px-1 rounded-2xl text-center border transition active:scale-95 ${
                      date === dayAfterIST
                        ? "bg-slate-950 text-white border-slate-950 shadow-xs font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <div className="text-[10px] opacity-75 uppercase">Next Day</div>
                    <div className="text-xs">{dayAfterIST.split("-")[2]} {formatDateLabel(dayAfterIST).split(" ")[2]}</div>
                  </button>
                </div>

                {/* Native iOS Calendar Picker for custom dates */}
                <div className="pt-1 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span className="text-[11px] font-medium">Or choose any other date:</span>
                  <input
                    type="date"
                    min={todayIST}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* CARD 2: START TIME & SLOTS (Categorized & High Contrast for Mobile) */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 border border-white shadow-[0_4px_24px_rgba(20,60,110,0.05)] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      2. Select Time Slot
                    </label>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {formatTimeSlot(startTime)} – {formatTimeSlot(endTime)}
                  </span>
                </div>

                {/* Mobile Filter Tabs for Family Sessions (Day vs Evening) */}
                {isFamily && (
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSlotFilter("ALL")}
                      className={`flex-1 py-1 rounded-xl transition ${slotFilter === "ALL" ? "bg-white text-slate-950 shadow-2xs font-extrabold" : "text-slate-600"}`}
                    >
                      All (14 Slots)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlotFilter("DAY")}
                      className={`flex-1 py-1 rounded-xl transition ${slotFilter === "DAY" ? "bg-white text-slate-950 shadow-2xs font-extrabold" : "text-slate-600"}`}
                    >
                      ☀️ Day (9 AM – 4 PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlotFilter("EVENING")}
                      className={`flex-1 py-1 rounded-xl transition ${slotFilter === "EVENING" ? "bg-white text-slate-950 shadow-2xs font-extrabold" : "text-slate-600"}`}
                    >
                      🌙 Evening (4 PM – 11 PM)
                    </button>
                  </div>
                )}

                {/* Slots Grid: Touch-optimized 44px+ buttons with micro-labels */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                        title={slotInfo?.reason || undefined}
                        onClick={() => {
                          if (isDisabled) return;
                          setStartTime(slot);
                          const [sH] = slot.split(":").map(Number);
                          const allowed = Math.max(1, Math.min(4, sessionEndHour - sH));
                          if (durationHours > allowed) {
                            setDurationHours(allowed);
                          }
                        }}
                        className={`p-2.5 rounded-2xl border text-center transition-all active:scale-95 select-none ${
                          isSelected
                            ? "bg-slate-950 border-slate-950 text-white shadow-md ring-2 ring-cyan-400/40"
                            : isPast
                            ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed opacity-50"
                            : isBooked
                            ? "border-rose-100 bg-rose-50/70 text-rose-700 cursor-not-allowed"
                            : isHeld
                            ? "border-amber-100 bg-amber-50/70 text-amber-700 cursor-not-allowed"
                            : "border-slate-200/80 bg-white hover:border-slate-400 text-slate-800 hover:shadow-2xs"
                        }`}
                      >
                        <div className={`text-xs font-black font-mono tracking-tight ${isSelected ? "text-white" : ""}`}>
                          {formatTimeSlot(slot)}
                        </div>
                        <div
                          className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
                            isSelected
                              ? "text-cyan-300"
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
                            ? "Selected ✓"
                            : isPast
                            ? "Past"
                            : isBooked
                            ? "Booked"
                            : isHeld
                            ? "In Hold"
                            : bookingType === "PUBLIC" && slotInfo?.remainingCapacity !== undefined && slotInfo.remainingCapacity < 10
                            ? `${slotInfo.remainingCapacity} Left`
                            : "Available"}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Visual Legend */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-950" /> Selected
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Booked
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> In Checkout
                  </span>
                </div>
              </div>

              {/* CARD 3: GUESTS & DURATION (iOS Steppers & Segmented Pills) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 3A: Number of Guests */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-[0_4px_24px_rgba(20,60,110,0.05)] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-700" />
                      <span>3. Swimmers</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      {isFamily ? "Max 30" : "Max 25 cap"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-100/90 rounded-2xl p-1.5 border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="w-10 h-10 rounded-xl bg-white text-slate-800 font-black hover:bg-slate-50 active:scale-95 shadow-xs flex items-center justify-center text-lg select-none"
                    >
                      –
                    </button>
                    <div className="text-center">
                      <span className="text-lg font-black font-mono text-slate-900 block leading-tight">
                        {guestCount}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {guestCount === 1 ? "Person" : "Guests"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.min(isFamily ? 30 : 25, guestCount + 1))}
                      className="w-10 h-10 rounded-xl bg-white text-slate-800 font-black hover:bg-slate-50 active:scale-95 shadow-xs flex items-center justify-center text-lg select-none"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight">
                    {isFamily
                      ? "Base rate includes up to 12 people. ₹100/hr per additional guest."
                      : "₹150 per swimmer per hour. Full payment required online."}
                  </p>
                </div>

                {/* 3B: Duration Selection (1-Tap Pills instead of Select dropdown) */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-[0_4px_24px_rgba(20,60,110,0.05)] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-700" />
                      <span>4. Duration</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      until {formatTimeSlot(endTime)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4]
                      .filter((h) => h <= maxAllowedHours && !isDurationColliding(startTime, h))
                      .map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setDurationHours(h)}
                          className={`py-2 px-2.5 rounded-2xl border text-center transition active:scale-95 ${
                            durationHours === h
                              ? "bg-slate-950 text-white border-slate-950 font-black shadow-xs"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold"
                          }`}
                        >
                          <div className="text-xs font-mono">{h} Hour{h > 1 ? "s" : ""}</div>
                          <div className={`text-[9px] font-normal ${durationHours === h ? "text-cyan-300" : "text-slate-500"}`}>
                            til {formatTimeSlot(getEndTime(startTime, h))}
                          </div>
                        </button>
                      ))}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-tight">
                    {isFamily ? "Facility closes at 11:00 PM." : "Public sessions finish at 4:00 PM."}
                  </p>
                </div>
              </div>

              {/* CARD 4: CONTACT & SWIMMER DETAILS (iOS Grouped Input Style) */}
              <div id="contact-section" className="bg-white rounded-3xl p-4 sm:p-6 border border-white shadow-[0_4px_24px_rgba(20,60,110,0.05)] space-y-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-cyan-50 text-cyan-700 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    5. Contact Details
                  </label>
                </div>

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
                        placeholder="e.g. Rahul Sharma"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
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
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                        />
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
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
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                        />
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Notes / Special Requests <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Bringing small kids, require swimming rings"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* CARD 5: POLICY SUMMARY ACCORDION */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-white shadow-2xs space-y-2">
                <button
                  type="button"
                  onClick={() => setShowRulesModal(!showRulesModal)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>{isFamily ? "Family Exclusive Slot Guidelines" : "Public Swimming Hygiene & Rules"}</span>
                  </div>
                  <span className="text-xs text-cyan-700 font-bold">
                    {showRulesModal ? "Hide ▲" : "View Rules ▼"}
                  </span>
                </button>

                {showRulesModal && (
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 pt-2 border-t border-slate-100 leading-relaxed animate-in fade-in">
                    {isFamily ? (
                      <>
                        <li><strong>100% Private:</strong> Public swimmers are completely barred from entry during your slot.</li>
                        <li><strong>Advance:</strong> ₹750 online advance secures slot. Remaining ₹{remainingArrivalBalance} payable on arrival.</li>
                        <li><strong>Hygiene:</strong> Mandatory warm shower before pool entry. Proper synthetic swimwear required.</li>
                      </>
                    ) : (
                      <>
                        <li><strong>Shared Pool:</strong> Max 25 swimmers allowed in pool at any time.</li>
                        <li><strong>Payment:</strong> 100% advance online payment required. Zero counter queue.</li>
                        <li><strong>Safety:</strong> Certified lifebuoys and duty lifeguard present at all times.</li>
                      </>
                    )}
                  </ul>
                )}
              </div>

            </div>

            {/* Right Column (Desktop Sticky Summary Card) */}
            <div className="hidden lg:block lg:col-span-5 sticky top-24 space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-white shadow-[0_4px_30px_rgba(20,60,110,0.06)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-sm font-black text-slate-950 uppercase tracking-wider">
                    Booking Summary
                  </h2>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700">
                    {isFamily ? "100% Exclusive" : "Shared Public"}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Date</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {date} ({formatDateLabel(date)})
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Time Slot</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatTimeSlot(startTime)} – {formatTimeSlot(endTime)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Duration</span>
                    <span className="font-bold text-slate-900">
                      {durationHours} Hour{durationHours > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Swimmers</span>
                    <span className="font-bold text-slate-900">
                      {guestCount} {isFamily && guestCount <= 12 ? "(up to 12 included)" : ""}
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  {isFamily ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Base Rate ({durationHours} hr, up to 12)</span>
                        <span className="font-mono text-slate-900 font-bold">₹{1500 * durationHours}</span>
                      </div>
                      {extraGuests > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Extra Guests ({extraGuests} &times; ₹100/hr)</span>
                          <span className="font-mono text-slate-900 font-bold">₹{extraGuestFee}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>Public Pool ({guestCount} swimmers &times; {durationHours} hr)</span>
                      <span className="font-mono text-slate-900 font-bold">₹{computedTotal}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-sm text-slate-950 pt-2 border-t border-slate-100">
                    <span>Total Session Value</span>
                    <span className="font-mono text-base">₹{computedTotal}</span>
                  </div>
                </div>

                {/* Online Due Highlight Box */}
                <div className={`p-4 rounded-2xl border space-y-1 ${
                  isFamily ? "bg-amber-50/70 border-amber-200/90 text-amber-950" : "bg-emerald-50/70 border-emerald-200/90 text-emerald-950"
                }`}>
                  <div className="flex justify-between items-center font-bold text-xs">
                    <span>{isFamily ? "Advance Payable Online" : "Full Payment (100%)"}</span>
                    <span className="text-lg font-black font-mono">₹{requiredPaymentAmount}</span>
                  </div>
                  <p className="text-[11px] leading-tight opacity-80">
                    {isFamily
                      ? `Pay ₹${requiredPaymentAmount} to reserve. Remaining ₹${remainingArrivalBalance} due on arrival.`
                      : "Instant entry confirmation. Zero counter queues."}
                  </p>
                </div>

                {/* Desktop Proceed Button */}
                <button
                  type="button"
                  disabled={loading || (availResult && !availResult.available)}
                  onClick={handleProceedToPayment}
                  className={`w-full font-black py-3.5 rounded-full text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    availResult && !availResult.available
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-slate-950 hover:bg-slate-800 text-white shadow-slate-900/15"
                  }`}
                >
                  {loading
                    ? "Reserving Slot..."
                    : availResult && !availResult.available
                    ? "Slot Unavailable"
                    : `Proceed to Payment (₹${requiredPaymentAmount})`}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-tight">
                  🔒 Locks your slot for 15 minutes during checkout
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MOBILE-FIRST FIXED BOTTOM FLOATING ACTION DOCK (Apple iOS Style)
            Always visible right under the user's thumb on phone screens!
           ========================================================================= */}
        {step === 1 && (
          <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/85 backdrop-blur-2xl border-t border-slate-200/80 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
            <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {isFamily ? "Advance Due Now" : "Total Admission"}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-slate-900 font-mono">
                    ₹{requiredPaymentAmount}
                  </span>
                  {isFamily && remainingArrivalBalance > 0 && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      (+₹{remainingArrivalBalance} at pool)
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 truncate font-semibold">
                  {date === todayIST ? "Today" : date} • {formatTimeSlot(startTime)} ({durationHours}h)
                </div>
              </div>

              <button
                type="button"
                disabled={loading || (availResult && !availResult.available)}
                onClick={handleProceedToPayment}
                className={`px-6 py-3 rounded-full text-xs font-black shadow-md flex items-center gap-1.5 shrink-0 transition active:scale-95 ${
                  availResult && !availResult.available
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-slate-950 hover:bg-slate-800 text-white shadow-slate-900/20"
                }`}
              >
                <span>{loading ? "Holding..." : "Continue"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: 15-MINUTE SLOT HOLD & SECURE CHECKOUT (iOS Card)
           ========================================================================= */}
        {step === 2 && (
          <div className="max-w-xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* 15-Min Live Hold Timer Banner */}
            <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-6 text-center space-y-2 shadow-xl border border-slate-800">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-black uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>Slot Temporarily Reserved</span>
              </div>

              <div className="text-4xl font-black font-mono tracking-widest text-cyan-400 pt-1">
                {formatTimer(secondsRemaining)}
              </div>

              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your pool slot is held exclusively for you. Complete verification before the timer expires.
              </p>
            </div>

            {/* Booking Details Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-white shadow-sm space-y-3.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Order Review
              </h3>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Guest Name</span>
                  <span className="font-bold text-slate-900">{customerName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mobile</span>
                  <span className="font-bold font-mono text-slate-900">{customerPhone}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Session</span>
                  <span className="font-bold font-mono text-slate-900">{date} • {formatTimeSlot(startTime)} ({durationHours}h)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Type</span>
                  <span className="font-bold text-slate-900">{isFamily ? "Family Exclusive" : "Public Swimming"}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span>Amount Due Now:</span>
                  <span className="font-mono font-black text-base text-emerald-700">₹{requiredPaymentAmount}</span>
                </div>
                {isFamily && remainingArrivalBalance > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Counter Balance upon Arrival:</span>
                    <span className="font-mono font-bold text-slate-800">₹{remainingArrivalBalance}</span>
                  </div>
                )}
              </div>

              {/* Simulated Payment Method Selector */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Payment Option (Sandbox Gateway)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("UPI")}
                    className={`py-2.5 px-2 rounded-2xl border text-center transition ${
                      selectedPayMethod === "UPI"
                        ? "bg-slate-950 text-white border-slate-950 font-bold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-[11px]">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("CARD")}
                    className={`py-2.5 px-2 rounded-2xl border text-center transition ${
                      selectedPayMethod === "CARD"
                        ? "bg-slate-950 text-white border-slate-950 font-bold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-[11px]">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayMethod("NETBANKING")}
                    className={`py-2.5 px-2 rounded-2xl border text-center transition ${
                      selectedPayMethod === "NETBANKING"
                        ? "bg-slate-950 text-white border-slate-950 font-bold shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <Lock className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-[11px]">Net Banking</span>
                  </button>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompletePayment}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white font-black py-4 rounded-full text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Verifying Transaction...</span>
                  ) : (
                    <>
                      <span>Confirm &amp; Pay ₹{requiredPaymentAmount}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  &larr; Modify Slot &amp; Guest Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: APPLE WALLET STYLE DIGITAL BOOKING PASS & RECEIPT
           ========================================================================= */}
        {step === 3 && confirmedBooking && (
          <div className="max-w-lg mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-400">
            {/* Success Banner */}
            <div className="text-center space-y-1.5 pb-2">
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

            {/* Digital Pass (Apple Wallet aesthetic) */}
            <div className="bg-white rounded-3xl border border-white shadow-xl overflow-hidden">
              {/* Pass Top Banner */}
              <div className="bg-slate-950 text-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Waves className="w-5 h-5 text-cyan-400" />
                    <span className="font-black text-sm tracking-wider uppercase">M.A.K Indoor Pool</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                    Confirmed Pass
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-cyan-300 block">
                      Booking Reference ID
                    </span>
                    <span className="text-xl font-mono font-black tracking-wider">
                      {confirmedBooking.id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(confirmedBooking.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Perforated Divider */}
              <div className="relative h-4 bg-white flex items-center justify-between px-2 overflow-hidden">
                <div className="w-4 h-4 rounded-full bg-[#F0F5FA] -ml-4" />
                <div className="w-full border-t-2 border-dashed border-slate-200" />
                <div className="w-4 h-4 rounded-full bg-[#F0F5FA] -mr-4" />
              </div>

              {/* Pass Details Body */}
              <div className="p-5 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date</span>
                    <span className="font-bold font-mono text-slate-900">{confirmedBooking.bookingDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Session Time</span>
                    <span className="font-bold font-mono text-slate-900">
                      {formatTimeSlot(confirmedBooking.startTime)} – {formatTimeSlot(confirmedBooking.endTime)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Guest Name</span>
                    <span className="font-bold text-slate-900">{confirmedBooking.customerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Swimmer Count</span>
                    <span className="font-bold text-slate-900">{confirmedBooking.guestCount} Guests</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Paid Online</span>
                    <span className="font-bold font-mono text-emerald-700 text-sm">₹{confirmedBooking.totalPaid}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Balance on Arrival</span>
                    <span className="font-bold font-mono text-slate-900 text-sm">
                      {confirmedBooking.balanceAmount > 0 ? `₹${confirmedBooking.balanceAmount}` : "₹0 (Fully Paid)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: WhatsApp Share + Print + Manage */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleShareWhatsApp(confirmedBooking)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3.5 rounded-full text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Booking Pass on WhatsApp</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold py-2.5 rounded-full text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>

                <Link
                  href={`/booking-status?ref=${confirmedBooking.id}&phone=${customerPhone}`}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold py-2.5 rounded-full text-xs text-center flex items-center justify-center transition active:scale-95 shadow-2xs"
                >
                  <span>Self-Service</span>
                </Link>
              </div>

              <Link
                href="/"
                className="block text-center text-xs text-slate-500 hover:text-slate-900 font-semibold py-2 transition"
              >
                &larr; Return to Home Page
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
