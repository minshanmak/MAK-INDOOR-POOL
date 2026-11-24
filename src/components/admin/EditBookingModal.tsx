"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  RefreshCw,
  Edit3,
  IndianRupee,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { formatSlotTime, getPoolDate } from "@/lib/timezone";

interface EditBookingModalProps {
  booking: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBooking: any) => void;
}

// 12-hour formatter for slot buttons
function format12Hour(time24: string): string {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m || 0).padStart(2, "0")} ${period}`;
}

const QUICK_REASONS = [
  "📞 Phone Request (Time Shift)",
  "👥 Added Swimmers",
  "📅 Rescheduled Date",
  "📱 Phone / Name Typo Fix",
  "⏳ Extended Duration",
  "🚶 Counter Walk-in Request",
];

export default function EditBookingModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: EditBookingModalProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [durationHours, setDurationHours] = useState(1);
  const [guestCount, setGuestCount] = useState(2);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPlace, setCustomerPlace] = useState("");
  const [staffReason, setStaffReason] = useState("");
  const [notes, setNotes] = useState("");

  const [daySlots, setDaySlots] = useState<Record<string, any>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Pricing config
  const [pricingConfig, setPricingConfig] = useState({
    defaultPublicRate: 150,
    defaultFamilyBaseRate: 1500,
    familyBaseGuests: 12,
    familyExtraRate: 100,
    maxCapacity: 25,
    publicEndHour: 16,
    openHour: 9,
    closeHour: 23,
  });

  // Calculate quick relative date strings
  const { todayStr, tomorrowStr, dayAfterStr } = useMemo(() => {
    const today = new Date();
    const todayFormatted = getPoolDate(today);

    const tom = new Date(today);
    tom.setDate(tom.getDate() + 1);
    const tomFormatted = getPoolDate(tom);

    const da = new Date(today);
    da.setDate(da.getDate() + 2);
    const daFormatted = getPoolDate(da);

    return { todayStr: todayFormatted, tomorrowStr: tomFormatted, dayAfterStr: daFormatted };
  }, []);

  // Fetch pool settings on mount
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
            maxCapacity: cfg.maxCapacity ?? 25,
            publicEndHour: cfg.publicEndHour ?? 16,
            openHour: cfg.openHour ?? 9,
            closeHour: cfg.closeHour ?? 23,
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Sync state whenever booking changes
  useEffect(() => {
    if (booking) {
      setDate(booking.bookingDate || "");
      setStartTime(booking.startTime || "10:00");
      setDurationHours(booking.durationHours || 1);
      setGuestCount(booking.guestCount || 2);
      setCustomerName(booking.customerName || "");
      setCustomerPhone(booking.customerPhone || "");
      setCustomerPlace(booking.customerPlace || "");
      setNotes(booking.notes || "");
      setStaffReason("");
      setErrorMsg(null);
      setCopiedId(false);
    }
  }, [booking]);

  // Fetch availability when date or booking type changes
  const fetchAvailability = useCallback(async () => {
    if (!date || !booking) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/availability?date=${encodeURIComponent(date)}&type=${encodeURIComponent(booking.type)}`
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
  }, [date, booking]);

  useEffect(() => {
    if (isOpen && booking && date) {
      fetchAvailability();
    }
  }, [isOpen, date, booking?.type, fetchAvailability]);

  // Compute calculated end time
  const calculatedEndTime = useMemo(() => {
    if (!startTime) return "11:00";
    const [h, m] = startTime.split(":").map(Number);
    const totalMinutes = h * 60 + (m || 0) + durationHours * 60;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  }, [startTime, durationHours]);

  // Build slot list for the booking type
  const isFamily = booking?.type === "FAMILY";
  const slotList = useMemo(() => {
    if (!booking) return [];
    const list: {
      key: string;
      label: string;
      isCurrentBookingSlot: boolean;
      status: "AVAILABLE" | "BOOKED" | "HELD" | "PAST";
      remainingSpots?: number;
    }[] = [];

    const openH = pricingConfig.openHour || 9;
    const closeH = pricingConfig.closeHour || 23;
    const pubEndH = pricingConfig.publicEndHour || 16;

    const startH = isFamily ? pubEndH : openH;
    const endH = isFamily ? closeH : pubEndH;

    for (let h = startH; h < endH; h++) {
      const key = `${String(h).padStart(2, "0")}:00`;
      const endKey = `${String(h + 1).padStart(2, "0")}:00`;
      const label = `${format12Hour(key)} – ${format12Hour(endKey)}`;

      const isCurrentBookingSlot =
        booking.bookingDate === date && booking.startTime === key;

      const slotData = daySlots[key];
      let status: "AVAILABLE" | "BOOKED" | "HELD" | "PAST" =
        slotData?.status || "AVAILABLE";

      // If this slot is the booking's own slot, it is NEVER booked against itself!
      if (isCurrentBookingSlot) {
        status = "AVAILABLE";
      }

      let remainingSpots = slotData?.remainingCapacity;
      if (isCurrentBookingSlot && remainingSpots !== undefined) {
        remainingSpots += booking.guestCount;
      }

      list.push({
        key,
        label,
        isCurrentBookingSlot,
        status,
        remainingSpots,
      });
    }

    return list;
  }, [booking, date, daySlots, isFamily, pricingConfig]);

  // Check multi-hour conflict
  const slotConflict = useMemo(() => {
    if (durationHours <= 1 || !startTime) return null;
    const [startH] = startTime.split(":").map(Number);
    for (let i = 1; i < durationHours; i++) {
      const checkKey = `${String(startH + i).padStart(2, "0")}:00`;
      const slotData = daySlots[checkKey];
      const isBookingOwnConsecutive =
        booking?.bookingDate === date &&
        booking?.startTime === startTime &&
        i < (booking?.durationHours || 1);

      if (slotData && slotData.status !== "AVAILABLE" && !isBookingOwnConsecutive) {
        return {
          slot: checkKey,
          label: format12Hour(checkKey),
          status: slotData.status,
        };
      }
    }
    return null;
  }, [startTime, durationHours, daySlots, booking, date]);

  // Live price calculation estimate
  const pricePreview = useMemo(() => {
    if (!booking) return { newTotal: 0, newBalance: 0 };
    let newTotal = 0;
    if (isFamily) {
      const base = (pricingConfig.defaultFamilyBaseRate || 1500) * durationHours;
      const baseGuests = pricingConfig.familyBaseGuests || 12;
      const extraGuests = Math.max(0, guestCount - baseGuests);
      newTotal = base + extraGuests * (pricingConfig.familyExtraRate || 100) * durationHours;
    } else {
      newTotal = guestCount * durationHours * (pricingConfig.defaultPublicRate || 150);
    }
    const alreadyPaid = booking.totalPaid || 0;
    const newBalance = Math.round((newTotal - alreadyPaid) * 100) / 100;
    return { newTotal, newBalance, alreadyPaid };
  }, [booking, durationHours, guestCount, isFamily, pricingConfig]);

  if (!isOpen || !booking) return null;

  const handleCopyId = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(booking.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSelectReasonChip = (chip: string) => {
    // If reason is empty, set it directly; otherwise append
    if (!staffReason.trim()) {
      setStaffReason(chip);
    } else if (!staffReason.includes(chip)) {
      setStaffReason(`${staffReason}, ${chip}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!staffReason.trim()) {
      setErrorMsg("Please provide a reason for the modification (Audit Log required).");
      return;
    }

    if (slotConflict) {
      setErrorMsg(
        `Cannot extend to ${durationHours} hours: Slot ${slotConflict.label} is already ${slotConflict.status}. Please choose 1 hour or select another start time.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_BOOKING",
          bookingId: booking.id,
          bookingDate: date,
          startTime,
          endTime: calculatedEndTime,
          guestCount,
          customerName,
          customerPhone,
          customerPlace,
          notes,
          staffReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update booking.");
      }

      onSuccess(data.booking);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const guestPresets = isFamily ? [6, 8, 10, 12, 15, 20] : [1, 2, 4, 6, 8, 10];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-white/80 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#0F172A] text-white p-4 sm:p-5 relative overflow-hidden shrink-0">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Edit3 className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">Edit Booking</h3>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px] font-semibold transition"
                    title="Click to copy Pass ID"
                  >
                    <span>{booking.id}</span>
                    {copiedId ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Counter modification &bull; Auto recalculates balance &amp; dispatches updated pass
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Header Badges */}
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                isFamily
                  ? "bg-purple-900/60 text-purple-200 border border-purple-700/50"
                  : "bg-blue-900/60 text-blue-200 border border-blue-700/50"
              }`}
            >
              {isFamily ? "Family (Exclusive Session)" : "Public Swimming"}
            </span>

            <div className="flex items-center gap-3 text-[11px] text-slate-300">
              <span>
                Original Total:{" "}
                <strong className="text-white tabular-nums">₹{booking.totalAmount}</strong>
              </span>
              <span>
                Paid Online:{" "}
                <strong className="text-emerald-400 tabular-nums">₹{booking.totalPaid}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: Session Date with Quick Jump Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1D68BD]" />
                <span>1. Session Date</span>
              </label>

              {/* 1-Tap Quick Date Chips */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDate(todayStr)}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    date === todayStr
                      ? "bg-[#1D68BD] text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDate(tomorrowStr)}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    date === tomorrowStr
                      ? "bg-[#1D68BD] text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setDate(dayAfterStr)}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition ${
                    date === dayAfterStr
                      ? "bg-[#1D68BD] text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Day After
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/90 rounded-2xl font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* SECTION 2: Visual Interactive Slot Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1D68BD]" />
                <span>2. Select Time Slot</span>
              </label>

              <button
                type="button"
                onClick={fetchAvailability}
                disabled={loadingSlots}
                className="text-[10px] font-bold text-[#1D68BD] hover:text-blue-800 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loadingSlots ? "animate-spin" : ""}`} />
                <span>Refresh Live Slots</span>
              </button>
            </div>

            {loadingSlots ? (
              <div className="p-4 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#1D68BD]" />
                <span>Checking slot availability for {date}...</span>
              </div>
            ) : slotList.length === 0 ? (
              <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                No slots configured for this session type.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[160px] overflow-y-auto p-1.5 bg-slate-50/70 rounded-2xl border border-slate-100">
                {slotList.map(({ key, label, isCurrentBookingSlot, status, remainingSpots }) => {
                  const isSelected = startTime === key;
                  const isAvailable = status === "AVAILABLE";

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setStartTime(key)}
                      className={`p-2 rounded-xl text-left border transition relative flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#1D68BD] text-white border-[#1D68BD] shadow-md shadow-blue-700/20 ring-2 ring-blue-500/30"
                          : isCurrentBookingSlot
                          ? "bg-purple-50/90 border-purple-300 text-purple-950 hover:bg-purple-100/90"
                          : isAvailable
                          ? "bg-white hover:bg-emerald-50/60 border-slate-200 text-slate-800"
                          : "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div className="font-extrabold text-[11px] leading-tight flex items-center justify-between">
                        <span>{format12Hour(key)}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />}
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[9px] font-bold">
                        <span
                          className={`px-1.5 py-0.2 rounded-md uppercase tracking-wider ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : isCurrentBookingSlot
                              ? "bg-purple-200/90 text-purple-800"
                              : isAvailable
                              ? "bg-emerald-100 text-emerald-800"
                              : status === "BOOKED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isCurrentBookingSlot
                            ? "Current"
                            : isAvailable
                            ? "Open"
                            : status}
                        </span>

                        {!isFamily && isAvailable && remainingSpots !== undefined && (
                          <span
                            className={`tabular-nums text-[9px] ${
                              isSelected ? "text-blue-100" : "text-slate-500"
                            }`}
                          >
                            {remainingSpots} left
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* SECTION 3: Duration Selector with Quick Pills */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Session Duration
                </label>
                <span className="text-[11px] font-bold text-[#1D68BD]">
                  {formatSlotTime(startTime)} &rarr; {formatSlotTime(calculatedEndTime)} ({durationHours}{" "}
                  {durationHours === 1 ? "Hour" : "Hours"})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setDurationHours(hrs)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs border transition flex items-center justify-center gap-1.5 ${
                      durationHours === hrs
                        ? "bg-[#1D68BD] text-white border-[#1D68BD] shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{hrs} {hrs === 1 ? "Hour" : "Hours"}</span>
                  </button>
                ))}
              </div>

              {slotConflict && (
                <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-center gap-2 text-[11px] font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    Cannot extend to {durationHours} hours: Slot {slotConflict.label} is already{" "}
                    {slotConflict.status}.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: Swimmers Count Stepper + Fast Presets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#1D68BD]" />
                <span>3. Number of Swimmers (Guests)</span>
              </label>

              <span className="text-[10px] font-medium text-slate-500">
                {isFamily
                  ? "Base ₹1,500/hr (12 guests) + ₹100/extra guest"
                  : "₹150 per swimmer per hour"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Stepper */}
              <div className="flex items-center bg-slate-50 border border-slate-200/90 rounded-2xl p-1">
                <button
                  type="button"
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                  className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center shadow-xs transition"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold text-sm text-slate-900 tabular-nums">
                  {guestCount}
                </span>
                <button
                  type="button"
                  onClick={() => setGuestCount(guestCount + 1)}
                  className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center shadow-xs transition"
                >
                  +
                </button>
              </div>

              {/* Fast Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {guestPresets.map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setGuestCount(cnt)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                      guestCount === cnt
                        ? "bg-[#1D68BD] text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {cnt} {cnt === 1 ? "Guest" : "Guests"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 5: Financial Recalculation Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-2.5">
            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">
                  Original Total
                </span>
                <span className="font-bold text-slate-700 text-sm tabular-nums">
                  ₹{booking.totalAmount}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">
                  New Total
                </span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">
                  ₹{pricePreview.newTotal}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase block tracking-wider">
                  Paid Online
                </span>
                <span className="font-bold text-emerald-700 text-sm tabular-nums">
                  ₹{booking.totalPaid}
                </span>
              </div>
            </div>

            {/* Bottom Status Ribbon */}
            <div
              className={`p-2 rounded-xl text-center font-bold text-xs flex items-center justify-center gap-2 ${
                pricePreview.newBalance > 0
                  ? "bg-amber-100/80 text-amber-900 border border-amber-300"
                  : pricePreview.newBalance === 0
                  ? "bg-emerald-100/80 text-emerald-900 border border-emerald-300"
                  : "bg-blue-100/80 text-blue-900 border border-blue-300"
              }`}
            >
              <IndianRupee className="w-3.5 h-3.5" />
              {pricePreview.newBalance > 0 ? (
                <span>
                  Collect Counter Balance:{" "}
                  <strong className="text-amber-950 tabular-nums">
                    ₹{pricePreview.newBalance}
                  </strong>{" "}
                  (Cash / UPI QR)
                </span>
              ) : pricePreview.newBalance === 0 ? (
                <span>Fully Settled — No additional payment required</span>
              ) : (
                <span>
                  Customer Excess Credit:{" "}
                  <strong className="tabular-nums">₹{Math.abs(pricePreview.newBalance)}</strong>
                </span>
              )}
            </div>
          </div>

          {/* SECTION 6: Customer Details (Typo corrections) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#1D68BD]" />
              <span>4. Customer Information</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/90 rounded-2xl font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="Mobile Number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/90 rounded-2xl font-bold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition tabular-nums"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Place / Town"
                    value={customerPlace}
                    onChange={(e) => setCustomerPlace(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/90 rounded-2xl font-semibold text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                  />
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 7: 1-Tap Quick Reason Chips for Audit Trail */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#1D68BD]" />
                <span>5. Reason for Update (Audit Log - Required)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">1-tap to fill</span>
            </div>

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSelectReasonChip(chip)}
                  className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 hover:bg-blue-50 hover:text-[#1D68BD] border border-slate-200/80 text-slate-700 transition active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              placeholder="e.g. Customer called to shift time, added 2 swimmers"
              value={staffReason}
              onChange={(e) => setStaffReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200/90 rounded-2xl font-medium text-slate-800 text-xs focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
            />
          </div>

          {/* Notification Assurance Banner */}
          <div className="p-2.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1D68BD] shrink-0" />
            <span>
              Customer will automatically receive an updated confirmation pass via WhatsApp and SMS
              on <strong>{customerPhone || booking.customerPhone}</strong>.
            </span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !!slotConflict}
              className="px-5 py-2 rounded-2xl bg-[#1D68BD] hover:bg-[#155299] text-white font-bold shadow-md shadow-blue-700/20 active:scale-95 transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating &amp; Notifying...</span>
                </>
              ) : (
                <>
                  <span>Save Changes &amp; Notify</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
