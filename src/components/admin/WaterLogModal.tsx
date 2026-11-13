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
          filterStatus,
          waterClarity,
          remarks: remarks.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record water test.");
      }

      onSuccess(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit water reading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-[12px] shadow-xl border-[0.5px] border-slate-300 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-sky-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0">
              <Droplets className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Water safety log
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Twice-daily chlorine and pH verification
              </p>
            </div>
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-[12px] bg-rose-50 border-[0.5px] border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.75} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Out of Range Alert Preview */}
          {isOutOfRange && (
            <div className="p-3 bg-red-50 border-[0.5px] border-red-300 rounded-[12px] text-red-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" strokeWidth={1.75} />
              <div>
                <strong className="block font-bold">Out-of-range reading detected</strong>
                <span>
                  Safe ranges: Chlorine 1.5–3.0 ppm, pH 7.2–7.6. This reading will be pinned to the dashboard alert strip.
                </span>
              </div>
            </div>
          )}

          {/* Chlorine Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-800">Free chlorine (ppm)</label>
              <span className="text-[11px] text-slate-500">Target: 1.5 – 3.0 ppm</span>
            </div>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              required
              value={chlorinePpm}
              onChange={(e) => setChlorinePpm(e.target.value)}
              className={`w-full min-h-[44px] px-3.5 bg-slate-50 border-[0.5px] rounded-[12px] font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 ${
                isChlorineOptimal ? "border-slate-200 focus:ring-[#0284C7]" : "border-red-400 bg-red-50/40 text-red-900"
              }`}
            />
          </div>

          {/* pH Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-800">pH level</label>
              <span className="text-[11px] text-slate-500">Target: 7.2 – 7.6</span>
            </div>
            <input
              type="number"
              step="0.1"
              min="5"
              max="9"
              required
              value={phLevel}
              onChange={(e) => setPhLevel(e.target.value)}
              className={`w-full min-h-[44px] px-3.5 bg-slate-50 border-[0.5px] rounded-[12px] font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 ${
                isPhOptimal ? "border-slate-200 focus:ring-[#0284C7]" : "border-red-400 bg-red-50/40 text-red-900"
              }`}
            />
          </div>

          {/* Filter Status Selector */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5">Filter pump status</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFilterStatus("OPTIMAL")}
                className={`min-h-[44px] rounded-[12px] border-[0.5px] font-bold text-xs transition ${
                  filterStatus === "OPTIMAL"
                    ? "bg-[#0284C7] text-white border-[#0284C7] shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Optimal
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("RUNNING")}
                className={`min-h-[44px] rounded-[12px] border-[0.5px] font-bold text-xs transition ${
                  filterStatus === "RUNNING"
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Running
              </button>
            </div>
          </div>

          {/* Water Clarity */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">Water clarity</label>
            <select
              value={waterClarity}
              onChange={(e) => setWaterClarity(e.target.value)}
              className="w-full min-h-[44px] px-3 bg-slate-50 border-[0.5px] border-slate-200 rounded-[12px] font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
            >
              <option value="CLEAR">Crystal clear (normal)</option>
              <option value="SLIGHTLY_CLOUDY">Slightly cloudy</option>
              <option value="TURBID">Turbid (requires treatment)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] bg-[#0284C7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-[12px] transition shadow-xs flex items-center justify-center gap-2"
          >
            {loading ? "Recording..." : "Save water safety reading"}
          </button>
        </form>
      </div>
    </div>
  );
}
