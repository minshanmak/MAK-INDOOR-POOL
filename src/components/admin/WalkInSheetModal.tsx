"use client";

import React, { useState } from "react";
import {
  X,
  Users,
  Coins,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Plus,
  Minus,
} from "lucide-react";
import { checkPublicCapacity } from "@/lib/pricing";
import { offlineStore } from "@/lib/offline-store";

interface WalkInSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOccupancy: number;
  maxCapacity?: number;
  isPrivateSessionActive: boolean;
  nextPublicSessionText?: string;
  onSuccess: (newWalkIn: any) => void;
}

export default function WalkInSheetModal({
  isOpen,
  onClose,
  currentOccupancy,
  maxCapacity = 25,
  isPrivateSessionActive,
  nextPublicSessionText = "Tomorrow at 9:00 AM",
  onSuccess,
}: WalkInSheetModalProps) {
  // Step 1: Guest count & duration, Step 2: Payment method, Step 3: Confirmed
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [guestCount, setGuestCount] = useState<number>(2);
  const [durationHours, setDurationHours] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI">("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const remainingCapacity = Math.max(0, maxCapacity - currentOccupancy);
  const pricePerHour = 150;
  const totalPrice = guestCount * pricePerHour * durationHours;

  const capacityCheck = checkPublicCapacity(currentOccupancy, guestCount, maxCapacity);

  const handleChipSelect = (count: number) => {
    if (count <= remainingCapacity) {
      setGuestCount(count);
      setErrorMsg(null);
    }
  };

  const handleIncrement = () => {
    if (guestCount < remainingCapacity) {
      setGuestCount((prev) => prev + 1);
      setErrorMsg(null);
    }
  };

  const handleDecrement = () => {
    if (guestCount > 1) {
      setGuestCount((prev) => prev - 1);
      setErrorMsg(null);
    }
  };

  const handleSubmit = async () => {
    if (guestCount <= 0 || !capacityCheck.allowed) {
      setErrorMsg(`Cannot exceed capacity limit of ${maxCapacity} swimmers.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      visitorCount: guestCount,
      durationHours,
      ratePerHour: pricePerHour,
      paymentMethod,
      customerName: customerName.trim() || `Walk-in (${guestCount} Guests)`,
      customerPhone: customerPhone.trim() || undefined,
    };

    // If offline, store locally in sync queue with sequential receipt number
    if (!offlineStore.isOnline()) {
      const offlineItem = offlineStore.enqueueAction("WALKIN_CREATE", payload);
      setSubmitting(false);
      setStep(3);
      onSuccess({
        id: offlineItem.localReceiptNumber || `OFFLINE-${Date.now()}`,
        visitorCount: guestCount,
        durationHours,
        customerName: payload.customerName,
        paymentMethod,
        isOffline: true,
      });
      return;
    }

    try {
      const res = await fetch("/api/admin/walkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record walk-in.");
      }

      setStep(3);
      onSuccess(data.walkIn);
    } catch (err: any) {
      setErrorMsg(err.message || "Could not complete walk-in check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white rounded-[12px] shadow-xl border-[0.5px] border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header (Visual System: 12px radius, sentence case) */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-sky-50/60">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Walk in admission
            </h3>
            <p className="text-xs text-slate-500 font-normal">
              Two-step counter check in
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

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Private Session Rejection Guard */}
          {isPrivateSessionActive ? (
            <div className="p-4 rounded-[12px] bg-amber-50 border-[0.5px] border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.75} />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    Walk ins disabled during private session
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Exclusive family session is currently active. The facility is 100% reserved and closed to public walk-in swimmers.
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Next public window:</span>
                <span className="font-bold text-slate-900">{nextPublicSessionText}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] bg-slate-900 text-white text-xs font-bold rounded-[12px] hover:bg-slate-800 transition"
              >
                Return to dashboard
              </button>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-[12px] bg-rose-50 border-[0.5px] border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* STEP 1: Guests & Duration (Reference Pattern 1: Behance tablet checkout / Square POS) */}
              {step === 1 && (
                <div className="space-y-4">
                  {/* Capacity Remaining Banner (Text label paired with color) */}
                  <div className="flex items-center justify-between p-3 rounded-[12px] bg-sky-50 border-[0.5px] border-sky-100 text-xs">
                    <span className="font-medium text-slate-700">Available pool capacity</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded-[8px] border-[0.5px] ${
                        remainingCapacity <= 3
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : remainingCapacity <= 8
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-sky-100 text-[#0284C7] border-sky-200"
                      }`}
                    >
                      {remainingCapacity} of {maxCapacity} spots free
                    </span>
                  </div>

                  {/* Quick Chip Selection (1, 2, 3, 4, 5) with large tap targets >= 44px */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Number of swimmers
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((count) => {
                        const isOverflow = count > remainingCapacity;
                        const isSelected = guestCount === count;
                        return (
                          <button
                            key={count}
                            type="button"
                            disabled={isOverflow}
                            onClick={() => handleChipSelect(count)}
                            className={`min-h-[48px] rounded-[12px] border-[0.5px] text-sm font-bold transition flex items-center justify-center ${
                              isOverflow
                                ? "bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed"
                                : isSelected
                                ? "bg-[#0284C7] border-[#0284C7] text-white shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {count}
                          </button>
                        );
                      })}
                    </div>

                    {/* Stepper for 5+ or larger groups */}
                    <div className="flex items-center justify-between mt-2.5 p-2 bg-slate-50 rounded-[12px] border-[0.5px] border-slate-200">
                      <span className="text-xs font-medium text-slate-600 pl-1.5">
                        Larger party or custom count
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDecrement}
                          disabled={guestCount <= 1}
                          className="w-10 h-10 rounded-[8px] bg-white border-[0.5px] border-slate-200 text-slate-700 disabled:opacity-40 flex items-center justify-center active:scale-95 transition"
                          aria-label="Decrease"
                        >
                          <Minus className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-slate-900 text-sm">
                          {guestCount}
                        </span>
                        <button
                          type="button"
                          onClick={handleIncrement}
                          disabled={guestCount >= remainingCapacity}
                          className="w-10 h-10 rounded-[8px] bg-white border-[0.5px] border-slate-200 text-slate-700 disabled:opacity-40 flex items-center justify-center active:scale-95 transition"
                          aria-label="Increase"
                        >
                          <Plus className="w-4 h-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Duration Selection (1 hr or 2 hr) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Session duration
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setDurationHours(hrs)}
                          className={`min-h-[44px] rounded-[12px] border-[0.5px] text-xs font-bold transition flex items-center justify-center gap-2 ${
                            durationHours === hrs
                              ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <Clock className="w-4 h-4" strokeWidth={1.75} />
                          <span>{hrs} Hour{hrs > 1 ? "s" : ""}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Preview (Square POS pattern: price preview shown before confirmation, primary action anchored) */}
                  <div className="p-3.5 rounded-[12px] bg-slate-50 border-[0.5px] border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Price preview ({guestCount} × ₹150 × {durationHours}h)
                      </span>
                      <span className="text-xl font-mono font-extrabold text-slate-900">
                        ₹{totalPrice}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={!capacityCheck.allowed}
                      onClick={() => setStep(2)}
                      className="min-h-[44px] px-5 bg-[#0284C7] hover:bg-[#0369a1] disabled:opacity-40 text-white text-xs font-bold rounded-[12px] transition flex items-center gap-2 active:scale-95 shadow-xs"
                    >
                      <span>Select payment</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Payment Method (Square POS pattern: Cash or UPI selector with anchored primary button) */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-[12px] bg-sky-50 border-[0.5px] border-sky-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Total payable now</span>
                      <span className="text-2xl font-mono font-extrabold text-[#0284C7]">₹{totalPrice}</span>
                    </div>
                    <div className="text-right text-xs">
                      <span className="font-bold text-slate-900 block">{guestCount} swimmers</span>
                      <span className="text-slate-500">{durationHours} hour session</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Payment method
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("CASH")}
                        className={`min-h-[50px] p-3 rounded-[12px] border-[0.5px] text-xs font-bold transition flex items-center justify-center gap-2 ${
                          paymentMethod === "CASH"
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Coins className="w-4 h-4" strokeWidth={1.75} />
                        <span>Cash at counter</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("UPI")}
                        className={`min-h-[50px] p-3 rounded-[12px] border-[0.5px] text-xs font-bold transition flex items-center justify-center gap-2 ${
                          paymentMethod === "UPI"
                            ? "bg-[#0284C7] border-[#0284C7] text-white shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <CreditCard className="w-4 h-4" strokeWidth={1.75} />
                        <span>UPI QR scan</span>
                      </button>
                    </div>
                  </div>

                  {/* Optional Guest Name / Phone */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Group or customer name (optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Shameer and friends"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full min-h-[44px] px-3 bg-slate-50 border-[0.5px] border-slate-200 rounded-[12px] text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Contact phone (optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="10-digit number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full min-h-[44px] px-3 bg-slate-50 border-[0.5px] border-slate-200 rounded-[12px] text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
                      />
                    </div>
                  </div>

                  {/* Primary Action Anchored in Exact Same Bottom Position */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="min-h-[44px] px-4 rounded-[12px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmit}
                      className="flex-1 min-h-[44px] bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-[12px] transition shadow-xs flex items-center justify-center gap-2"
                    >
                      {submitting ? "Processing..." : `Confirm admission (${guestCount} swimmers)`}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Confirmed Screen (Receipt, receipt number, timer running) */}
              {step === 3 && (
                <div className="text-center py-5 space-y-3.5">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Admission confirmed
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {guestCount} swimmers admitted for {durationHours} hour(s). Session timer is now active.
                    </p>
                  </div>
                  <div className="p-3 rounded-[12px] bg-slate-50 border-[0.5px] border-slate-200 text-xs font-mono font-bold text-slate-700">
                    Collected ₹{totalPrice} via {paymentMethod}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full min-h-[44px] bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-[12px] transition"
                  >
                    Done
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
