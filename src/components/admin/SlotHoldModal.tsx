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
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/50">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              15-Minute Soft Hold
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Reserve slot for phone enquiries (No payment required)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {holdSuccess ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">
                Slot Held for 15 Minutes
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                The slot has been blocked across the system until{" "}
                <strong>{new Date(holdSuccess.expiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] bg-slate-900 text-white font-bold text-xs rounded-2xl"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleHoldSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Session Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBookingType("FAMILY")}
                  className={`min-h-[44px] rounded-2xl border text-xs font-bold transition ${
                    bookingType === "FAMILY"
                      ? "bg-[#0284C7] text-white border-[#0284C7]"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  Exclusive Family
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType("PUBLIC")}
                  className={`min-h-[44px] rounded-2xl border text-xs font-bold transition ${
                    bookingType === "PUBLIC"
                      ? "bg-[#0284C7] text-white border-[#0284C7]"
                      : "bg-white text-slate-700 border-slate-200"
                  }`}
                >
                  Public Swimming
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Caller / Customer Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Faisal (Phone Enquiry)"
                value={callerName}
                onChange={(e) => setCallerName(e.target.value)}
                className="w-full min-h-[44px] px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] bg-[#0284C7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-2xl transition shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? "Holding Slot..." : "Start 15-Minute Soft Hold"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

