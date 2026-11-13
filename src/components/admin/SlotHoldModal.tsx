"use client";

import React, { useState } from "react";
import { X, Clock, Calendar, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { getPoolDate } from "@/lib/timezone";

interface SlotHoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (hold: any) => void;
}

export default function SlotHoldModal({
  isOpen,
  onClose,
  onSuccess,
}: SlotHoldModalProps) {
  const [bookingType, setBookingType] = useState<"PUBLIC" | "FAMILY">("FAMILY");
  const [date, setDate] = useState<string>(getPoolDate());
  const [startTime, setStartTime] = useState<string>("16:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [guestCount, setGuestCount] = useState<number>(8);
  const [callerName, setCallerName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [holdSuccess, setHoldSuccess] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleHoldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

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
          callerName: callerName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to place 15-minute hold.");
      }

      setHoldSuccess(data);
      onSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to hold slot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-[12px] shadow-xl border-[0.5px] border-slate-300 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-sky-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              15-minute soft hold
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Reserve slot for phone enquiries (no payment required)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-[8px] bg-white border-[0.5px] border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {holdSuccess ? (
          <div className="p-6 text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Slot held for 15 minutes
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                The slot has been reserved until{" "}
                <strong>{new Date(holdSuccess.expiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] bg-slate-900 text-white font-bold text-xs rounded-[12px]"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleHoldSubmit} className="p-5 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-[12px] bg-rose-50 border-[0.5px] border-rose-200 text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Booking Type */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">Session type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBookingType("FAMILY")}
                  className={`min-h-[44px] rounded-[12px] border-[0.5px] font-bold text-xs transition ${
                    bookingType === "FAMILY"
                      ? "bg-purple-700 text-white border-purple-700 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Private family
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType("PUBLIC")}
                  className={`min-h-[44px] rounded-[12px] border-[0.5px] font-bold text-xs transition ${
                    bookingType === "PUBLIC"
                      ? "bg-[#0284C7] text-white border-[#0284C7] shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  Public swimming
                </button>
              </div>
            </div>

            {/* Caller Name */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Caller name or phone</label>
              <input
                type="text"
                required
                placeholder="e.g. Faisal Phone Enquiry"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 bg-slate-50 border-[0.5px] border-slate-200 rounded-[12px] font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Start time</label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-slate-50 border-[0.5px] border-slate-200 rounded-[12px] font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">End time</label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-slate-50 border-[0.5px] border-slate-200 rounded-[12px] font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
                />
              </div>
            </div>

            {/* Swimmers */}
            <div>
              <label className="block font-bold text-slate-800 mb-1">Estimated swimmers</label>
              <input
                type="number"
                min="1"
                max="25"
                required
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full min-h-[44px] px-3.5 bg-slate-50 border-[0.5px] border-slate-200 rounded-[12px] font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-[12px] transition shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? "Placing hold..." : "Confirm 15-minute soft hold"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
