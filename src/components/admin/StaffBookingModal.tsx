"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  Phone,
  User,
  MapPin,
  CreditCard,
  Banknote,
  Sparkles,
  Waves,
  RefreshCw,
  Printer,
  Copy,
  ChevronRight,
  ShieldCheck,
  MessageCircle,
  Send,
} from "lucide-react";
import { getPoolDate } from "@/lib/timezone";

interface StaffBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: any) => void;
  defaultBookingType?: "FAMILY" | "PUBLIC";
  defaultDate?: string;
  defaultSlot?: string;
}

interface SlotInfo {
  slot: string;
  status: "AVAILABLE" | "BOOKED" | "HELD" | "PAST";
  reason?: string;
  currentOccupancy?: number;
  remainingSpots?: number;
}

export default function StaffBookingModal({
  isOpen,
  onClose,
  onSuccess,
  defaultBookingType = "FAMILY",
  defaultDate,
  defaultSlot,
}: StaffBookingModalProps) {
  const todayStr = useMemo(() => getPoolDate(), []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return getPoolDate(d);
  }, []);

  // Form states
  const [bookingType, setBookingType] = useState<"FAMILY" | "PUBLIC">(defaultBookingType);
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate || todayStr);
  const [selectedSlot, setSelectedSlot] = useState<string>(defaultSlot || "16:00");
  const [durationHours, setDurationHours] = useState<number>(1);
  const [guestCount, setGuestCount] = useState<number>(defaultBookingType === "FAMILY" ? 10 : 2);

  // Customer states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPlace, setCustomerPlace] = useState("");
  const [staffNotes, setStaffNotes] = useState("");

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI">("CASH");
  const [advanceAmount, setAdvanceAmount] = useState<number>(750);
  const [customAdvance, setCustomAdvance] = useState(false);

  // Slots availability state
  const [daySlots, setDaySlots] = useState<Record<string, SlotInfo>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Settings
  const [pricingConfig, setPricingConfig] = useState({
    defaultPublicRate: 150,
    defaultFamilyBaseRate: 1500,
    familyBaseGuests: 12,
    familyExtraRate: 100,
    familyAdvanceAmount: 750,
    maxCapacity: 25,
    publicEndHour: 16,
    openHour: 9,
    closeHour: 23,
  });

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<any | null>(null);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Sync defaultBookingType if prop changes
  useEffect(() => {
    if (defaultBookingType) {
      setBookingType(defaultBookingType);
      if (defaultBookingType === "FAMILY") {
        setGuestCount(10);
        setSelectedSlot(defaultSlot || "16:00");
      } else {
        setGuestCount(2);
        setSelectedSlot(defaultSlot || "10:00");
      }
    }
  }, [defaultBookingType, defaultSlot]);

  // Load pool settings on mount
  useEffect(() => {
    fetch("/api/pool-config")
      .then((res) => res.json())
      .then((cfg) => {
        if (cfg) {
          setPricingConfig((prev) => ({
            ...prev,
            defaultPublicRate: cfg.defaultPublicRate ?? 150,
            defaultFamilyBaseRate: cfg.defaultFamilyBaseRate ?? 1500,
            familyBaseGuests: cfg.familyBaseGuests ?? 12,
            familyExtraRate: cfg.familyExtraRate ?? 100,
            familyAdvanceAmount: 750,
            maxCapacity: cfg.maxCapacity ?? 25,
            publicEndHour: cfg.publicEndHour ?? 16,
            openHour: cfg.openHour ?? 9,
            closeHour: cfg.closeHour ?? 23,
          }));
        }
      })
      .catch((err) => console.error("Error loading pool config", err));
  }, []);

  // Fetch slots availability when date or bookingType changes
  const fetchAvailability = useCallback(async () => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/availability?date=${encodeURIComponent(selectedDate)}&type=${encodeURIComponent(bookingType)}`
      );
      const data = await res.json();
      if (data && data.slots) {
        setDaySlots(data.slots);
      }
    } catch (err) {
      console.error("Error fetching day slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, bookingType]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailability();
    }
  }, [isOpen, fetchAvailability]);

  // Calculate pricing
  const pricing = useMemo(() => {
    if (bookingType === "PUBLIC") {
      const total = guestCount * durationHours * pricingConfig.defaultPublicRate;
      return {
        basePrice: total,
        extraGuestsPrice: 0,
        totalPrice: total,
        suggestedAdvance: total, // Public normally pays full
      };
    } else {
      // Family
      const base = durationHours * pricingConfig.defaultFamilyBaseRate;
      const extraGuests = Math.max(0, guestCount - pricingConfig.familyBaseGuests);
      const extraGuestsPrice = extraGuests * pricingConfig.familyExtraRate * durationHours;
      const total = base + extraGuestsPrice;
      const suggestedAdvance = pricingConfig.familyAdvanceAmount;
      return {
        basePrice: base,
        extraGuestsPrice,
        totalPrice: total,
        suggestedAdvance,
      };
    }
  }, [bookingType, guestCount, durationHours, pricingConfig]);

  // Keep advanceAmount updated when pricing changes unless user typed custom
  useEffect(() => {
    if (!customAdvance) {
      setAdvanceAmount(pricing.suggestedAdvance);
    }
  }, [pricing.suggestedAdvance, customAdvance]);

  // Helper: format 24h to 12h label
  const format12Hour = (time24: string) => {
    const [h, m] = time24.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${String(h12).padStart(2, "0")}:${String(m || 0).padStart(2, "0")} ${period}`;
  };

  // Helper: calculate end time
  const getEndTime = (start: string, duration: number) => {
    const [h, m] = start.split(":").map(Number);
    const totalMinutes = h * 60 + (m || 0) + duration * 60;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  const calculatedEndTime = useMemo(() => {
    return getEndTime(selectedSlot, durationHours);
  }, [selectedSlot, durationHours]);

  // Multi-hour slot collision check
  const slotConflict = useMemo(() => {
    if (!selectedSlot || durationHours <= 1) return null;
    const [startH] = selectedSlot.split(":").map(Number);
    for (let i = 1; i < durationHours; i++) {
      const nextH = startH + i;
      const nextSlotKey = `${String(nextH).padStart(2, "0")}:00`;
      const slotData = daySlots[nextSlotKey];
      if (slotData && slotData.status !== "AVAILABLE") {
        return {
          slotKey: nextSlotKey,
          label: `${format12Hour(nextSlotKey)} – ${format12Hour(`${String(nextH + 1).padStart(2, "0")}:00`)}`,
          status: slotData.status,
          reason: slotData.reason || `Slot is ${slotData.status.toLowerCase()}`,
        };
      }
    }
    return null;
  }, [selectedSlot, durationHours, daySlots]);

  // Available slots array
  const slotList = useMemo(() => {
    const list: { key: string; label: string; info: SlotInfo }[] = [];
    const openH = pricingConfig.openHour || 9;
    const closeH = pricingConfig.closeHour || 23;
    const pubEndH = pricingConfig.publicEndHour || 16;

    const startH = bookingType === "PUBLIC" ? openH : pubEndH;
    const endH = bookingType === "PUBLIC" ? pubEndH : closeH;

    for (let h = startH; h < endH; h++) {
      const key = `${String(h).padStart(2, "0")}:00`;
      const endKey = `${String(h + 1).padStart(2, "0")}:00`;
      const label = `${format12Hour(key)} – ${format12Hour(endKey)}`;
      const info = daySlots[key] || { slot: key, status: "AVAILABLE" };
      list.push({ key, label, info });
    }
    return list;
  }, [bookingType, pricingConfig, daySlots]);

  // Auto-select first available slot if currently selected slot is invalid
  useEffect(() => {
    if (slotList.length > 0) {
      const currentSelectedData = daySlots[selectedSlot];
      const isCurrentValid =
        slotList.some((s) => s.key === selectedSlot) &&
        currentSelectedData?.status === "AVAILABLE";

      if (!isCurrentValid) {
        const firstAvailable = slotList.find((s) => s.info.status === "AVAILABLE");
        if (firstAvailable) {
          setSelectedSlot(firstAvailable.key);
        }
      }
    }
  }, [slotList, daySlots, selectedSlot]);

  if (!isOpen) return null;

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validations
    if (!customerName.trim()) {
      setErrorMsg("Please enter customer name.");
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (slotConflict) {
      setErrorMsg(
        `Cannot book ${durationHours} hours: Slot ${slotConflict.label} is already ${slotConflict.status}. Please choose 1 hour or select another start time.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        bookingType,
        date: selectedDate,
        startTime: selectedSlot,
        endTime: calculatedEndTime,
        guestCount: Number(guestCount),
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerPlace: customerPlace.trim() || undefined,
        notes: staffNotes.trim() || undefined,
        isStaffCreated: true,
        paymentMethod,
        initialAmount: Number(advanceAmount),
      };

      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to confirm staff booking.");
      }

      setSuccessBooking(data.booking || { id: data.bookingId, ...payload });
      onSuccess(data.booking || data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyWhatsApp = () => {
    if (!successBooking) return;
    const msg = `*M.A.K INDOOR POOL BOOKING CONFIRMATION*\n\n` +
      `📌 Booking ID: *${successBooking.id}*\n` +
      `👤 Name: ${customerName}\n` +
      `📅 Date: ${selectedDate}\n` +
      `⏰ Time: ${format12Hour(selectedSlot)} – ${format12Hour(calculatedEndTime)} (${durationHours} Hr)\n` +
      `👥 Guests: ${guestCount} Person(s)\n` +
      `🏷️ Type: ${bookingType === "FAMILY" ? "Family (Exclusive Session)" : "Public Swimming"}\n` +
      `💰 Total: ₹${pricing.totalPrice}\n` +
      `✅ Paid: ₹${advanceAmount} (${paymentMethod})\n` +
      `💵 Balance Due: ₹${Math.max(0, pricing.totalPrice - advanceAmount)}\n\n` +
      `📍 Location: Kalathingalpara, Moonniyur\n` +
      `Thank you for booking with us!`;

    navigator.clipboard.writeText(msg);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  const [smsSending, setSmsSending] = useState(false);
  const [smsSent, setSmsSent] = useState(false);

  const handleDirectWhatsApp = () => {
    if (!customerPhone || !successBooking) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://makindoorpool.com";
    const passUrl = `${origin}/booking-status?ref=${successBooking.id}&phone=${customerPhone}`;
    const msg =
      `🏊‍♂️ *M.A.K INDOOR POOL - BOOKING CONFIRMED* 🏊‍♂️\n\n` +
      `Hello *${customerName}*, your pool reservation is locked!\n\n` +
      `📋 *Pass ID:* ${successBooking.id}\n` +
      `📅 *Date:* ${selectedDate}\n` +
      `⏰ *Time Slot:* ${format12Hour(selectedSlot)} – ${format12Hour(calculatedEndTime)}\n` +
      `👥 *Guests:* ${guestCount} Person(s)\n` +
      `🏷️ *Type:* ${bookingType === "FAMILY" ? "Family (Exclusive Session)" : "Public Swimming"}\n\n` +
      `💰 *Total:* ₹${pricing.totalPrice}\n` +
      `✅ *Paid:* ₹${advanceAmount} (${paymentMethod})\n` +
      (pricing.totalPrice - advanceAmount > 0 ? `💵 *Balance Due:* ₹${pricing.totalPrice - advanceAmount}\n\n` : `✅ *Fully Paid*\n\n`) +
      `🎫 *Digital Pass:* \n${passUrl}\n\n` +
      `📍 Kalathingalpara, Moonniyur | 📞 +91 99477 14716`;
    const cleanPhone = customerPhone.replace(/\D/g, "").slice(-10);
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleDirectSms = async () => {
    if (!successBooking) return;
    setSmsSending(true);
    try {
      await fetch("/api/bookings/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: successBooking.id, channel: "SMS" }),
      });
      setSmsSent(true);
    } catch {
      // Ignore
    } finally {
      setSmsSending(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessBooking(null);
    setErrorMsg(null);
    setSmsSent(false);
    setSmsSending(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerPlace("");
    setStaffNotes("");
    setCustomAdvance(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden my-auto">
        {/* Success View */}
        {successBooking ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9 stroke-[2]" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" />
                Slot Locked & Confirmed
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Staff Booking Created!
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Reference ID: <span className="font-extrabold text-blue-600 font-mono">{successBooking.id}</span>
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 text-left border border-slate-200/80 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-slate-400 font-bold block text-[11px]">Customer</span>
                  <span className="font-extrabold text-slate-900">{customerName}</span>
                  <span className="text-slate-500 block text-[11px]">{customerPhone}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block text-[11px]">Session Date</span>
                  <span className="font-extrabold text-slate-900">{selectedDate}</span>
                  <span className="text-purple-700 font-bold block text-[11px]">
                    {bookingType === "FAMILY" ? "Family (Exclusive)" : "Public"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">Time Slot</span>
                  <span className="font-extrabold text-slate-800">
                    {format12Hour(selectedSlot)} – {format12Hour(calculatedEndTime)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">Duration</span>
                  <span className="font-extrabold text-slate-800">{durationHours} Hour(s)</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block text-[10px]">Guests</span>
                  <span className="font-extrabold text-slate-800">{guestCount} Swimmers</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Total Amount</span>
                  <span className="text-sm font-black text-slate-900">₹{pricing.totalPrice}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-emerald-600 font-bold block">Paid ({paymentMethod})</span>
                  <span className="text-sm font-black text-emerald-700">₹{advanceAmount}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-rose-500 font-bold block">Balance Due</span>
                  <span className="text-sm font-black text-rose-600">
                    ₹{Math.max(0, pricing.totalPrice - advanceAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleDirectWhatsApp}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp to Customer</span>
              </button>

              <button
                type="button"
                onClick={handleDirectSms}
                disabled={smsSending || smsSent}
                className="px-4 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-semibold text-xs shadow-md shadow-blue-700/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                <span>{smsSent ? "SMS Sent!" : smsSending ? "Sending..." : "Send SMS"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedWhatsApp ? "Copied!" : "Copy"}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-semibold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2.5 rounded-2xl bg-[#0F172A] hover:bg-slate-800 active:scale-95 text-white font-semibold text-xs shadow-md transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Normal Booking Creation Form */
          <div>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1D68BD] text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <span>New Staff Booking</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Front Desk
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Visual slot selection & live auto pricing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 text-rose-700 text-xs rounded-2xl flex items-start gap-2 border border-rose-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-bold">{errorMsg}</span>
                </div>
              )}

              {/* 1. Session Type Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  1. Select Booking Type
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingType("FAMILY");
                      setGuestCount(10);
                    }}
                    className={`p-3 rounded-2xl text-left border transition flex items-center gap-3 ${
                      bookingType === "FAMILY"
                        ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-950 font-black shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-bold"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        bookingType === "FAMILY" ? "bg-purple-600 text-white" : "bg-white text-purple-600"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">Family (Exclusive)</div>
                      <div className="text-[10px] text-purple-700 font-medium">
                        04:00 PM – 11:00 PM • Private
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBookingType("PUBLIC");
                      setGuestCount(2);
                    }}
                    className={`p-3 rounded-2xl text-left border transition flex items-center gap-3 ${
                      bookingType === "PUBLIC"
                        ? "bg-sky-50 border-[#1D68BD] ring-2 ring-blue-500/20 text-sky-950 font-black shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-bold"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        bookingType === "PUBLIC" ? "bg-[#1D68BD] text-white" : "bg-white text-[#1D68BD]"
                      }`}
                    >
                      <Waves className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs">Public Swimming</div>
                      <div className="text-[10px] text-sky-700 font-medium">
                        09:00 AM – 04:00 PM • General
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. Date Picker + Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    2. Select Date
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(todayStr)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
                        selectedDate === todayStr
                          ? "bg-[#1D68BD] text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(tomorrowStr)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
                        selectedDate === tomorrowStr
                          ? "bg-[#1D68BD] text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* 3. Visual Slot Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    3. Choose Available Time Slot
                  </label>
                  <button
                    type="button"
                    onClick={fetchAvailability}
                    disabled={loadingSlots}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingSlots ? "animate-spin" : ""}`} />
                    <span>Refresh Slots</span>
                  </button>
                </div>

                {loadingSlots ? (
                  <div className="p-6 text-center text-slate-400 font-bold bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#1D68BD]" />
                    <span>Checking live availability...</span>
                  </div>
                ) : slotList.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                    No slots scheduled for this session type.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto p-1 bg-slate-50/60 rounded-2xl border border-slate-100">
                    {slotList.map(({ key, label, info }) => {
                      const isAvailable = info.status === "AVAILABLE";
                      const isSelected = selectedSlot === key;

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedSlot(key)}
                          className={`p-2 rounded-xl text-left border transition relative flex flex-col justify-between ${
                            isSelected
                              ? "bg-[#1D68BD] text-white border-[#1D68BD] shadow-md shadow-blue-700/20 ring-2 ring-blue-500/30"
                              : isAvailable
                              ? "bg-white hover:bg-emerald-50/60 border-slate-200 text-slate-800"
                              : "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <div className="font-extrabold text-[11px] leading-tight">
                            {format12Hour(key)}
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[9px] font-black">
                            <span
                              className={`px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                                isSelected
                                  ? "bg-white/20 text-white"
                                  : isAvailable
                                  ? "bg-emerald-100 text-emerald-800"
                                  : info.status === "BOOKED"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {info.status === "AVAILABLE" ? "Open" : info.status}
                            </span>
                            {bookingType === "PUBLIC" && isAvailable && info.remainingSpots !== undefined && (
                              <span className={isSelected ? "text-blue-100" : "text-slate-500"}>
                                {info.remainingSpots} free
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Duration pills & Consecutive Conflict Warning */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-600 text-[11px]">Duration:</span>
                    {[1, 2, 3].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setDurationHours(dur)}
                        className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition ${
                          durationHours === dur
                            ? "bg-[#1D68BD] text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {dur} {dur === 1 ? "Hour" : "Hours"}
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] font-black text-slate-700">
                    Reserved Slot:{" "}
                    <span className="text-blue-700">
                      {format12Hour(selectedSlot)} – {format12Hour(calculatedEndTime)}
                    </span>
                  </div>
                </div>

                {slotConflict && (
                  <div className="p-2.5 bg-amber-50 text-amber-800 text-[11px] rounded-xl flex items-center gap-2 border border-amber-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      ⚠️ Next slot ({slotConflict.label}) is already <strong>{slotConflict.status}</strong>! Please choose 1 Hour or a different starting slot.
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Guest Count & Live Calculated Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Guests counter */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Number of Guests
                  </label>
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-black shadow-xs flex items-center justify-center transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={pricingConfig.maxCapacity || 30}
                      value={guestCount}
                      onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value)))}
                      className="w-full text-center font-black text-sm bg-transparent border-0 focus:ring-0 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setGuestCount(guestCount + 1)}
                      className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-black shadow-xs flex items-center justify-center transition"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {bookingType === "FAMILY"
                      ? `Includes up to ${pricingConfig.familyBaseGuests} swimmers (extra ₹${pricingConfig.familyExtraRate}/hr each)`
                      : `Standard ₹${pricingConfig.defaultPublicRate}/person/hr`}
                  </span>
                </div>

                {/* Auto Pricing Card */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-900">Total Calculated Amount</span>
                    <span className="text-base font-black text-blue-900 tabular-nums">
                      ₹{pricing.totalPrice}
                    </span>
                  </div>
                  <div className="text-[10px] text-blue-700 font-medium mt-0.5">
                    {bookingType === "FAMILY"
                      ? `${durationHours}h base: ₹${pricing.basePrice}${pricing.extraGuestsPrice > 0 ? ` + extra guests ₹${pricing.extraGuestsPrice}` : ""}`
                      : `${guestCount} swimmers × ${durationHours}h × ₹${pricingConfig.defaultPublicRate}`}
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200/60 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-600">Balance on Arrival:</span>
                    <span className="font-black text-rose-600">
                      ₹{Math.max(0, pricing.totalPrice - advanceAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Payment Collection & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Initial Advance / Amount Paid
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAdvance(false);
                        setAdvanceAmount(pricing.totalPrice);
                      }}
                      className="text-[10px] font-black text-blue-700 hover:underline"
                    >
                      Pay Full (₹{pricing.totalPrice})
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={advanceAmount}
                      onChange={(e) => {
                        setCustomAdvance(true);
                        setAdvanceAmount(Number(e.target.value));
                      }}
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl font-black text-xs text-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAdvance(false);
                        setAdvanceAmount(pricing.suggestedAdvance);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                    >
                      Min Advance (₹{pricing.suggestedAdvance})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAdvance(true);
                        setAdvanceAmount(0);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                    >
                      ₹0 (Pay Later)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("CASH")}
                      className={`py-2 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                        paymentMethod === "CASH"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Cash</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("UPI")}
                      className={`py-2 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                        paymentMethod === "UPI"
                          ? "bg-blue-50 border-[#1D68BD] text-blue-800 ring-2 ring-blue-500/20"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>UPI</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 6. Customer Details */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="block text-[11px] font-bold text-slate-700">
                  Customer Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Customer Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                    />
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="Mobile Number (10 Digits) *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Place / Town (Optional)"
                      value={customerPlace}
                      onChange={(e) => setCustomerPlace(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                    />
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Staff Notes (Optional: e.g. Birthday pool party, VIP)"
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] font-medium text-slate-700"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!slotConflict}
                  className="px-6 py-2.5 rounded-2xl bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-extrabold shadow-md shadow-blue-700/20 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Confirming & Locking...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Lock Slot</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
