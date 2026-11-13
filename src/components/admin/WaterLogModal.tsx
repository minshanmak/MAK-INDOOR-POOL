"use client";

import React, { useState } from "react";
import { X, Droplets, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { getPoolDate } from "@/lib/timezone";

interface WaterLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (reading: any) => void;
}

export default function WaterLogModal({
  isOpen,
  onClose,
  onSuccess,
}: WaterLogModalProps) {
  const [chlorinePpm, setChlorinePpm] = useState<string>("2.0");
  const [phLevel, setPhLevel] = useState<string>("7.4");
  const [filterStatus, setFilterStatus] = useState<"OPTIMAL" | "RUNNING" | "BACKWASH_NEEDED" | "ISSUE">("OPTIMAL");
  const [waterClarity, setWaterClarity] = useState<string>("CLEAR");
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const numChlorine = parseFloat(chlorinePpm) || 0;
  const numPh = parseFloat(phLevel) || 0;

  const isChlorineOptimal = numChlorine >= 1.5 && numChlorine <= 3.0;
  const isPhOptimal = numPh >= 7.2 && numPh <= 7.6;
  const isOutOfRange = !isChlorineOptimal || !isPhOptimal || filterStatus === "ISSUE";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "WATER_READING",
          date: getPoolDate(),
          time: timeStr,
          chlorinePpm: numChlorine,
          phLevel: numPh,
          waterClarity,
          status: isOutOfRange ? "WARNING" : "OPTIMAL",
          remarks: remarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log water reading.");
      }

      onSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to record reading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-white overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Log Water Safety
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Mandatory twice-daily chemical &amp; filtration check
              </p>
            </div>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Out of Range Warning Banner */}
          {isOutOfRange && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Out of Range Reading Detected</strong>
                <span>
                  {!isChlorineOptimal && "Chlorine must be 1.5–3.0 ppm. "}
                  {!isPhOptimal && "pH must be 7.2–7.6. "}
                  This will stay pinned to the dashboard alert strip until resolved.
                </span>
              </div>
            </div>
          )}

          {/* Chlorine & pH Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Chlorine (ppm)
                <span className="text-slate-400 font-normal ml-1">(1.5–3.0)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={chlorinePpm}
                onChange={(e) => setChlorinePpm(e.target.value)}
                className={`w-full min-h-[44px] px-3.5 border rounded-2xl text-sm font-mono font-bold focus:outline-none transition ${
                  isChlorineOptimal
                    ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500"
                    : "bg-rose-50 border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-500"
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                pH Level
                <span className="text-slate-400 font-normal ml-1">(7.2–7.6)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="6.0"
                max="9.0"
                required
                value={phLevel}
                onChange={(e) => setPhLevel(e.target.value)}
                className={`w-full min-h-[44px] px-3.5 border rounded-2xl text-sm font-mono font-bold focus:outline-none transition ${
                  isPhOptimal
                    ? "bg-slate-50 border-slate-200 text-slate-900 focus:ring-2 focus:ring-sky-500"
                    : "bg-rose-50 border-rose-300 text-rose-900 focus:ring-2 focus:ring-rose-500"
                }`}
              />
            </div>
          </div>

          {/* Filter Status Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Dual Sand Filtration Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFilterStatus("OPTIMAL")}
                className={`min-h-[44px] rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  filterStatus === "OPTIMAL"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Running Optimal</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("BACKWASH_NEEDED")}
                className={`min-h-[44px] rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  filterStatus === "BACKWASH_NEEDED"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>Backwash Needed</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Remarks / Chemical Dosing (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Added 200ml sodium hypochlorite"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full min-h-[44px] px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] bg-[#0284C7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-2xl transition shadow-xs flex items-center justify-center gap-2"
          >
            {loading ? "Submitting Log..." : "Save Water Log"}
          </button>
        </form>
      </div>
    </div>
  );
}
