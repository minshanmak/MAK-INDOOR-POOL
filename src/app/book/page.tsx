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
  Smartphone,
  Waves,
  Heart,
  Timer,
  CheckCircle,
  Sun,
  Moon,
} from "lucide-react";
import { getPoolDate, getPoolHour } from "@/lib/timezone";

function BookingContent() {
  const searchParams = useSearchParams();
  const paramType = searchParams.get("type")?.toUpperCase();
  const initialType: "PUBLIC" | "FAMILY" = paramType === "PUBLIC" ? "PUBLIC" : "FAMILY";

  // Wizard Step Tracker:
  // 1 = Select Type (Family vs Public)
  // 2 = Select Date & Time Slot
  // 3 = Select Guests & Duration
  // 4 = Contact Info & Final Review
  // 5 = 15-Minute Hold & Payment
  // 6 = Digital Pass & Receipt
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  const [bookingType, setBookingType] = useState<"PUBLIC" | "FAMILY">(initialType);
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("16:00");
  const [durationHours, setDurationHours] = useState<number>(1);
  const [guestCount, setGuestCount] = useState<number>(8);

  // Time Slot Filter on Step 2 (All vs Day vs Evening)
  const [slotFilter, setSlotFilter] = useState<"ALL" | "DAY" | "EVENING">("ALL");

  // Customer Contact Info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPlace, setCustomerPlace] = useState("");
  const [notes, setNotes] = useState("");

  // Payment Method choice in Step 5 (Simulated)
  const [selectedPayMethod, setSelectedPayMethod] = useState<"UPI" | "CARD" | "NETBANKING">("UPI");

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
    if (!holdExpiresAt || wizardStep !== 5) {
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
  }, [holdExpiresAt, wizardStep]);

  // Session limits & duration clamping
  const sessionEndHour = bookingType === "PUBLIC" ? 16 : 23;
  const [startH] = startTime.split(":").map(Number);
  const maxAllowedHours = Math.max(1, Math.min(4, sessionEndHour - startH));

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
            if (data.slots) {
              setDaySlots(data.slots);
            }
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Availability query failed", err);
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
      if (firstAvail) {
        setStartTime(firstAvail);
      }
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

  // Navigation handlers
  const goToStep = (stepNumber: 1 | 2 | 3 | 4 | 5 | 6) => {
    setError(null);
    setWizardStep(stepNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Validation before leaving Step 2 (Date & Time)
  const handleValidateStep2 = () => {
    const slotInfo = daySlots[startTime];
    const isPast = isSlotPastToday(startTime) || slotInfo?.status === "PAST";
    if (isPast || slotInfo?.status === "BOOKED" || slotInfo?.status === "HELD") {
      setError("The selected time slot is unavailable. Please select an available slot.");
      return;
    }
    goToStep(3);
  };

  // Validation before leaving Step 3 (Guests & Duration)
  const handleValidateStep3 = () => {
    if (isDurationColliding(startTime, durationHours)) {
      setError("Your selected duration overlaps with an already booked slot. Please choose fewer hours.");
      return;
    }
    goToStep(4);
  };

  // Step 4 to Step 5: Request 15-Minute Slot Hold and proceed to payment
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
      goToStep(5);
    } catch (err: any) {
      setError(err.message || "Could not reserve slot.");
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Complete Payment & Confirm Booking
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
      goToStep(6);
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
    const text = `*M.A.K INDOOR POOL BOOKING PASS*\n\n` +
      `*Pass ID:* ${booking.id}\n` +
      `*Type:* ${booking.type === "FAMILY" ? "Family & Group (Private)" : "Public Swimming"}\n` +
      `*Date:* ${booking.bookingDate}\n` +
      `*Time:* ${formatTimeSlot(booking.startTime)} – ${formatTimeSlot(booking.endTime)}\n` +
      `*Guests:* ${booking.guestCount} Guests\n` +
      (booking.customerPlace ? `*Place:* ${booking.customerPlace}\n` : "") +
      `*Paid Online:* ₹${booking.totalPaid}\n` +
      (booking.balanceAmount > 0 ? `*Balance Due at Arrival:* ₹${booking.balanceAmount}\n` : `*Status:* Paid in full\n`) +
      `\nLocation: Kalathingalpara, Moonniyur, Malappuram, Kerala\n` +
      `Helpline: +91 98470 12345`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const formatTimer = (totalSeconds: number | null) => {
    if (totalSeconds === null) return "15:00";
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F5FA] via-[#F4F8FC] to-[#EEF4FA] text-slate-800 pb-28 lg:pb-16 pt-4 sm:pt-8 selection:bg-slate-900 selection:text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5 sm:space-y-6">

        {/* =========================================================================
            TOP iOS PROGRESS BAR & NAVIGATION (Steps 1 to 4)
           ========================================================================= */}
        {wizardStep <= 4 && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              {wizardStep === 1 ? (
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 bg-white/80 hover:bg-white backdrop-blur-xl border border-white/90 px-3.5 py-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Home</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep((wizardStep - 1) as any)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white/80 hover:bg-white backdrop-blur-xl border border-white/90 px-3.5 py-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              )}

              {/* iOS Step Pill */}
              <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-xl border border-white/90 px-3.5 py-1.5 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-[11px] font-bold text-slate-700">
                <span className="text-[#00838F] font-extrabold">Step {wizardStep} of 4</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">
                  {wizardStep === 1 && "Session"}
                  {wizardStep === 2 && "Date & Time"}
                  {wizardStep === 3 && "Swimmers"}
                  {wizardStep === 4 && "Review & Pay"}
                </span>
              </div>
            </div>

            {/* Apple Segmented 4-Step Progress Bar */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    wizardStep >= s
                      ? "bg-slate-950 shadow-xs"
                      : "bg-slate-200/80"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-900 flex items-start gap-2.5 text-xs shadow-2xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="leading-relaxed font-semibold">{error}</div>
          </div>
        )}

        {/* =========================================================================
            STEP 1: SELECT SESSION (Family & Group vs Public Swimming)
           ========================================================================= */}
        {wizardStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Header */}
            <div className="text-center space-y-1.5 pb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Select Session
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-md mx-auto">
                Private pool rental for groups, or individual daytime swimming
              </p>
            </div>

            {/* Side-by-Side 2-Column Grid on Desktop, Stacked on Mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Option 1: Family & Group */}
              <button
                type="button"
                onClick={() => setBookingType("FAMILY")}
                className={`w-full text-left p-5 sm:p-6 rounded-3xl border-2 transition-all duration-200 active:scale-[0.99] flex flex-col justify-between relative overflow-hidden group ${
                  bookingType === "FAMILY"
                    ? "bg-white border-slate-950 shadow-[0_12px_36px_rgba(0,0,0,0.08)] ring-4 ring-slate-950/[0.04]"
                    : "bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md"
                }`}
              >
                <div>
                  {/* Top Bar: Title on left, Radio Checkmark on right (No eyebrow badge) */}
                  <div className="flex items-start justify-between gap-3 pb-3">
                    <div className="space-y-1">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-950 tracking-tight">
                        Family &amp; Group
                      </h2>
                      <p className="text-xs text-slate-500 leading-normal">
                        Exclusive access to the pool and lounge for your group.
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                        bookingType === "FAMILY"
                          ? "bg-slate-950 text-white shadow-xs"
                          : "border-2 border-slate-300 group-hover:border-slate-400"
                      }`}
                    >
                      {bookingType === "FAMILY" && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                  </div>

                  {/* Feature Highlights */}
                  <div className="pt-3.5 space-y-2 text-xs text-slate-600 border-t border-slate-100/90 mt-2">
                    <div className="flex items-center gap-2 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Full private access — entire facility reserved</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="w-4 h-4 text-cyan-700 shrink-0" />
                      <span>Up to 12 guests included (₹100/extra)</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Morning to night slots (9:00 AM – 11:00 PM)</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Price & Hours */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-950 font-mono tracking-tight">
                      ₹1,500
                    </span>
                    <span className="text-xs text-slate-500 font-medium ml-1">/ hour</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full font-mono">
                    9:00 AM – 11:00 PM
                  </span>
                </div>
              </button>

              {/* Option 2: Public Swimming */}
              <button
                type="button"
                onClick={() => setBookingType("PUBLIC")}
                className={`w-full text-left p-5 sm:p-6 rounded-3xl border-2 transition-all duration-200 active:scale-[0.99] flex flex-col justify-between relative overflow-hidden group ${
                  bookingType === "PUBLIC"
                    ? "bg-white border-slate-950 shadow-[0_12px_32px_rgba(0,0,0,0.08)] ring-4 ring-slate-950/[0.04]"
                    : "bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md"
                }`}
              >
                <div>
                  {/* Top Bar: Title on left, Radio Checkmark on right (No eyebrow badge) */}
                  <div className="flex items-start justify-between gap-3 pb-3">
                    <div className="space-y-1">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-950 tracking-tight">
                        Public Swimming
                      </h2>
                      <p className="text-xs text-slate-500 leading-normal">
                        Hourly passes for individual swimmers during open hours.
                      </p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 mt-0.5 ${
                        bookingType === "PUBLIC"
                          ? "bg-slate-950 text-white shadow-xs"
                          : "border-2 border-slate-300 group-hover:border-slate-400"
                      }`}
                    >
                      {bookingType === "PUBLIC" && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                  </div>

                  {/* Feature Highlights */}
                  <div className="pt-3.5 space-y-2 text-xs text-slate-600 border-t border-slate-100/90 mt-2">
                    <div className="flex items-center gap-2 font-medium">
                      <Waves className="w-4 h-4 text-cyan-700 shrink-0" />
                      <span>Shared pool access during daytime hours</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="w-4 h-4 text-cyan-700 shrink-0" />
                      <span>Priced per swimmer per hour</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Showers &amp; private lockers included</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Price & Hours */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-950 font-mono tracking-tight">
                      ₹150
                    </span>
                    <span className="text-xs text-slate-500 font-medium ml-1">/ person / hr</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full font-mono">
                    9:00 AM – 4:00 PM
                  </span>
                </div>
              </button>
            </div>

            {/* Bottom Continue Action */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="w-full sm:w-auto min-w-[260px] bg-slate-950 hover:bg-slate-800 text-white font-bold py-3.5 px-8 rounded-full text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 group"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: CHOOSE DATE & TIME SLOT
           ========================================================================= */}
        {wizardStep === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="text-center space-y-1 pb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Select Date &amp; Time
              </h1>
              <p className="text-xs text-slate-500 font-normal">
                {isFamily ? "Private slots available between 9:00 AM and 11:00 PM" : "Public swimming open from 9:00 AM to 4:00 PM"}
              </p>
            </div>

            {/* Date Selection Card */}
            <div className="bg-white rounded-3xl p-5 border border-white shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-700" />
                  <span>Date</span>
                </label>
                <span className="text-[11px] font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full">
                  {formatDateLabel(date)}
                </span>
              </div>

              {/* Quick Date Pills */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDate(todayIST)}
                  className={`py-2.5 px-2 rounded-2xl border text-center transition active:scale-95 ${
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
                  className={`py-2.5 px-2 rounded-2xl border text-center transition active:scale-95 ${
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
                  className={`py-2.5 px-2 rounded-2xl border text-center transition active:scale-95 ${
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
                <span className="text-[11px] font-medium">Pick another date:</span>
                <input
                  type="date"
                  min={todayIST}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Time Slot Selection Card */}
            <div className="bg-white rounded-3xl p-5 border border-white shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-700" />
                  <span>Start Time</span>
                </label>
                <span className="text-[11px] font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Selected: {formatTimeSlot(startTime)}
                </span>
              </div>

              {/* Day/Evening filter for Family */}
              {isFamily && (
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-[11px] font-medium">
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
                    className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${slotFilter === "DAY" ? "bg-white text-slate-950 shadow-xs font-bold" : "text-slate-600"}`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Day (9–4)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSlotFilter("EVENING")}
                    className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${slotFilter === "EVENING" ? "bg-white text-slate-950 shadow-xs font-bold" : "text-slate-600"}`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Evening (4–11)</span>
                  </button>
                </div>
              )}

              {/* Slot Chips Grid */}
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
                      onClick={() => {
                        if (isDisabled) return;
                        setStartTime(slot);
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all active:scale-95 select-none ${
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
                      <div className={`text-xs font-black font-mono tracking-tight ${isSelected ? "text-white" : ""}`}>
                        {formatTimeSlot(slot)}
                      </div>
                      <div
                        className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${
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
                          ? "In Hold"
                          : bookingType === "PUBLIC" && slotInfo?.remainingCapacity !== undefined && slotInfo.remainingCapacity < 10
                          ? `${slotInfo.remainingCapacity} Left`
                          : "Available"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Slot Legend */}
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
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> In Hold
                </span>
              </div>
            </div>

            {/* Bottom Continue Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleValidateStep2}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-3.5 rounded-full text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 group"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: CHOOSE SWIMMERS & DURATION
           ========================================================================= */}
        {wizardStep === 3 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="text-center space-y-1 pb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Swimmers &amp; Duration
              </h1>
              <p className="text-xs text-slate-500 font-normal">
                Select number of guests and booking duration
              </p>
            </div>

            {/* Swimmer Count Card (iOS Stepper) */}
            <div className="bg-white rounded-3xl p-5 border border-white shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-700" />
                  <span>Number of Swimmers</span>
                </label>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {isFamily ? "Max 30 Guests" : "Max 25 Swimmers"}
                </span>
              </div>

              {/* Large iOS Stepper */}
              <div className="flex items-center justify-between bg-slate-100/90 rounded-2xl p-2 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                  className="w-12 h-12 rounded-xl bg-white text-slate-800 font-black hover:bg-slate-50 active:scale-95 shadow-xs flex items-center justify-center text-xl select-none"
                >
                  –
                </button>
                <div className="text-center">
                  <span className="text-2xl font-black font-mono text-slate-950 block leading-tight">
                    {guestCount}
                  </span>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    {guestCount === 1 ? "Person" : "Guests"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setGuestCount(Math.min(isFamily ? 30 : 25, guestCount + 1))}
                  className="w-12 h-12 rounded-xl bg-white text-slate-800 font-black hover:bg-slate-50 active:scale-95 shadow-xs flex items-center justify-center text-xl select-none"
                >
                  +
                </button>
              </div>

              {/* Quick Size Chips */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Quick:</span>
                {isFamily ? (
                  [4, 8, 12, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGuestCount(num)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                        guestCount === num ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {num} {num === 12 ? "(Base)" : ""}
                    </button>
                  ))
                ) : (
                  [1, 2, 4, 6, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGuestCount(num)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                        guestCount === num ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {num}
                    </button>
                  ))
                )}
              </div>

              <p className="text-[11px] text-slate-500 leading-tight">
                {isFamily
                  ? "Base rate covers up to 12 guests. ₹100/hr for each additional guest."
                  : "₹150 per swimmer per hour."}
              </p>
            </div>

            {/* Duration Selector Card (1-Tap Pills) */}
            <div className="bg-white rounded-3xl p-5 border border-white shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-700" />
                  <span>Duration</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Until {formatTimeSlot(endTime)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[1, 2, 3, 4]
                  .filter((h) => h <= maxAllowedHours && !isDurationColliding(startTime, h))
                  .map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDurationHours(h)}
                      className={`py-3 px-2 rounded-2xl border text-center transition active:scale-95 ${
                        durationHours === h
                          ? "bg-slate-950 text-white border-slate-950 font-bold shadow-xs ring-2 ring-cyan-400/30"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                      }`}
                    >
                      <div className="text-xs font-mono">{h} Hour{h > 1 ? "s" : ""}</div>
                      <div className={`text-[10px] mt-0.5 ${durationHours === h ? "text-cyan-300" : "text-slate-500"}`}>
                        until {formatTimeSlot(getEndTime(startTime, h))}
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Live Price Estimation Pill */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-white shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  {isFamily ? "Advance Online" : "Total Admission"}
                </span>
                <span className="text-xl font-black text-slate-950 font-mono">
                  ₹{requiredPaymentAmount}
                </span>
                {isFamily && remainingArrivalBalance > 0 && (
                  <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                    (+₹{remainingArrivalBalance} on arrival)
                  </span>
                )}
              </div>

              <span className="text-xs font-bold text-cyan-800 bg-cyan-50 px-3 py-1.5 rounded-full">
                {guestCount} Guests • {durationHours}h
              </span>
            </div>

            {/* Bottom Continue Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleValidateStep3}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-3.5 rounded-full text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 group"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: CONTACT DETAILS & FINAL REVIEW
           ========================================================================= */}
        {wizardStep === 4 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="text-center space-y-1 pb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Review &amp; Contact
              </h1>
              <p className="text-xs text-slate-500 font-normal">
                Enter your details to receive your booking confirmation pass
              </p>
            </div>

            {/* Order Review Card */}
            <div className="bg-white rounded-3xl p-5 border border-white shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">
                  Session Summary
                </span>
                <span className="text-[11px] font-bold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded-full">
                  {isFamily ? "Family & Group" : "Public Swimming"}
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

                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-100 font-bold">
                  <span>Total Amount</span>
                  <span className="font-mono text-slate-900">₹{computedTotal}</span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80">
                  <span>{isFamily ? "Advance Payment:" : "Total Payable Now:"}</span>
                  <span className="text-base font-mono font-black">₹{requiredPaymentAmount}</span>
                </div>

                {isFamily && remainingArrivalBalance > 0 && (
                  <p className="text-[11px] text-slate-500 leading-tight">
                    * Remaining balance of <strong>₹{remainingArrivalBalance}</strong> is payable at the counter on arrival (Cash / UPI).
                  </p>
                )}
              </div>
            </div>

            {/* Contact Details Card */}
            <div className="bg-white rounded-3xl p-5 border border-white shadow-sm space-y-3.5">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-700" />
                <span>Guest Details</span>
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
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
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
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
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
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Place / Town Field with Quick Suggestions */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Place / Town / City <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">e.g. Moonniyur, Tirurangadi</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Enter your town / locality (e.g. Moonniyur)"
                      value={customerPlace}
                      onChange={(e) => setCustomerPlace(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>

                  {/* Quick Nearby Town Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nearby:</span>
                    {["Moonniyur", "Tirurangadi", "Chelari", "Calicut", "Kondotty", "Parappanangadi", "Kottakkal", "Tanur"].map((town) => (
                      <button
                        key={town}
                        type="button"
                        onClick={() => setCustomerPlace(town)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition active:scale-95 ${
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
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Proceed to Hold & Payment */}
            <div className="pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleProceedToPayment}
                className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-3.5 rounded-full text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <span>Holding slot for 15 minutes...</span>
                ) : (
                  <>
                    <span>Proceed to Payment (₹{requiredPaymentAmount})</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-2.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Your slot is held for 15 minutes during checkout</span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 5: 15-MINUTE SLOT HOLD & SECURE CHECKOUT
           ========================================================================= */}
        {wizardStep === 5 && (
          <div className="max-w-xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Live 15-Minute Hold Timer Banner */}
            <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-6 text-center space-y-2 shadow-xl border border-slate-800">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 text-xs font-semibold">
                <Timer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Slot held for 15 minutes</span>
              </div>

              <div className="text-4xl font-black font-mono tracking-widest text-cyan-400 pt-1">
                {formatTimer(secondsRemaining)}
              </div>

              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your pool slot is held. Complete checkout before the timer expires to confirm your reservation.
              </p>
            </div>

            {/* Booking Details Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-white shadow-sm space-y-3.5">
              <h3 className="text-xs font-bold text-slate-900">
                Booking Review
              </h3>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Customer Name</span>
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
                  <span>Session Type</span>
                  <span className="font-bold text-slate-900">{isFamily ? "Family & Group" : "Public Swimming"}</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span>Amount Due Now:</span>
                  <span className="font-mono font-black text-base text-emerald-700">₹{requiredPaymentAmount}</span>
                </div>
                {isFamily && remainingArrivalBalance > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Balance on Arrival:</span>
                    <span className="font-mono font-bold text-slate-800">₹{remainingArrivalBalance}</span>
                  </div>
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Payment Method
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

              {/* Confirm Payment CTA */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCompletePayment}
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-3.5 rounded-full text-xs sm:text-sm shadow-md transition active:scale-95 flex items-center justify-center gap-2 group"
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
                  onClick={() => goToStep(4)}
                  className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  &larr; Back to Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 6: APPLE WALLET STYLE DIGITAL BOOKING PASS & RECEIPT
           ========================================================================= */}
        {wizardStep === 6 && confirmedBooking && (
          <div className="max-w-lg mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-400">
            {/* Success Header */}
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

            {/* High-Resolution QR Booking Pass with Instant Download & WhatsApp Sharing */}
            <BookingPassCard booking={confirmedBooking} showActions={true} />

            <div className="pt-2 text-center space-y-2">
              <Link
                href={`/booking-status?ref=${confirmedBooking.id}&phone=${customerPhone}`}
                className="inline-block text-xs text-[#1D68BD] hover:underline font-bold"
              >
                Go to Self-Service &amp; Reschedule Portal &rarr;
              </Link>
              <div>
                <Link
                  href="/"
                  className="inline-block text-center text-xs text-slate-500 hover:text-slate-900 font-semibold py-1.5 transition"
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
