"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  ShieldCheck,
  IndianRupee,
} from "lucide-react";
import { formatSlotTime } from "@/lib/timezone";

interface EditBookingModalProps {
  booking: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBooking: any) => void;
}

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

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    }
  }, [booking]);

  // Compute calculated end time
  const calculatedEndTime = useMemo(() => {
    if (!startTime) return "11:00";
    const [h, m] = startTime.split(":").map(Number);
    const totalMinutes = h * 60 + (m || 0) + durationHours * 60;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  }, [startTime, durationHours]);

  // Live price calculation estimate (Standard rates: Public ₹150, Family base ₹1500 for up to 12)
  const pricePreview = useMemo(() => {
    if (!booking) return { newTotal: 0, newBalance: 0 };
    const isFamily = booking.type === "FAMILY";
    let newTotal = 0;
    if (isFamily) {
      const base = 1500 * durationHours;
      const extraGuests = Math.max(0, guestCount - 12);
      newTotal = base + extraGuests * 100 * durationHours;
    } else {
      newTotal = guestCount * durationHours * 150;
    }
    const newBalance = Math.max(0, Math.round((newTotal - (booking.totalPaid || 0)) * 100) / 100);
    return { newTotal, newBalance };
  }, [booking, durationHours, guestCount]);

  if (!isOpen || !booking) return null;

  const isFamily = booking.type === "FAMILY";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-white overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="bg-[#0F172A] text-white p-5 sm:p-6 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Edit Booking</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pass ID: <span className="text-blue-400 font-mono font-semibold">{booking.id}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                isFamily
                  ? "bg-purple-900/60 text-purple-200 border border-purple-700/50"
                  : "bg-blue-900/60 text-blue-200 border border-blue-700/50"
              }`}
            >
              {isFamily ? "Family (Exclusive Session)" : "Public Swimming"}
            </span>
            <span className="text-slate-400 text-[11px]">
              Paid Online: <strong className="text-emerald-400 tabular-nums">₹{booking.totalPaid}</strong>
            </span>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Date & Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Session Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Start Time
              </label>
              <div className="relative">
                <input
                  type="time"
                  required
                  step="3600"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                />
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Duration
              </label>
              <select
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
              >
                <option value={1}>1 Hour (Ends {formatSlotTime(calculatedEndTime)})</option>
                <option value={2}>2 Hours (Ends {formatSlotTime(calculatedEndTime)})</option>
                <option value={3}>3 Hours (Ends {formatSlotTime(calculatedEndTime)})</option>
              </select>
            </div>
          </div>

          {/* Row 2: Swimmers Count Stepper */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Number of Swimmers (Guests)
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-1">
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
              <span className="text-slate-500 text-[11px]">
                {isFamily
                  ? "₹1,500/hr (Base up to 12 guests, +₹100 for each additional)"
                  : "₹150 per person per hour"}
              </span>
            </div>
          </div>

          {/* Row 3: Financial Recalculation Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">New Total</span>
              <span className="font-bold text-slate-900 text-sm tabular-nums">₹{pricePreview.newTotal}</span>
              {pricePreview.newTotal !== booking.totalAmount && (
                <span className="text-[10px] text-slate-400 block line-through">₹{booking.totalAmount}</span>
              )}
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 font-semibold uppercase block">Already Paid</span>
              <span className="font-bold text-emerald-700 text-sm tabular-nums">₹{booking.totalPaid}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Balance Due</span>
              <span
                className={`font-bold text-sm tabular-nums ${
                  pricePreview.newBalance > 0 ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                ₹{pricePreview.newBalance}
              </span>
            </div>
          </div>

          {/* Row 4: Customer Details (Typo corrections) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Customer Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition tabular-nums"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Place / Town
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerPlace}
                  onChange={(e) => setCustomerPlace(e.target.value)}
                  placeholder="e.g. Moonniyur"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                />
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 5: Staff Reason for Modification */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Reason for Update (Audit Log)
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Customer called to shift from 4 PM to 6 PM, added 2 guests"
              value={staffReason}
              onChange={(e) => setStaffReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-2xl bg-[#1D68BD] hover:bg-[#155299] text-white font-semibold shadow-md shadow-blue-700/20 active:scale-95 transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving &amp; Notifying...</span>
                </>
              ) : (
                <span>Save Changes &amp; Notify</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
