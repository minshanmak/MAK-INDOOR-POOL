"use client";

import React, { useState, useEffect, useCallback } from "react";
import { formatPoolTime } from "@/lib/timezone";
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Minus,
  Plus,
  ChevronDown,
  User,
  Phone,
  Hourglass,
  Gauge,
  RefreshCw,
} from "lucide-react";

export default function AdminWalkinsPage() {
  const [walkIns, setWalkIns] = useState<any[]>([]);
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [maxCapacity, setMaxCapacity] = useState(25);
  const [remainingSpots, setRemainingSpots] = useState(25);
  const [isFamilyActive, setIsFamilyActive] = useState(false);
  const [activeFamily, setActiveFamily] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mode: "FULL" (Track customer details, duration) vs "QUICK" (Speedy entry & payment)
  const [entryMode, setEntryMode] = useState<"FULL" | "QUICK">("FULL");

  // Form states
  const [visitorCount, setVisitorCount] = useState(2);
  const [durationHours, setDurationHours] = useState(1);
  const [ratePerHour, setRatePerHour] = useState(150);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CASH">("UPI");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Table filter: "ALL" | "ACTIVE" | "CHECKED_OUT"
  const [tableFilter, setTableFilter] = useState<"ALL" | "ACTIVE" | "CHECKED_OUT">("ALL");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setEntryTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchWalkIns = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch("/api/admin/walkins?status=all");
      const data = await res.json();
      setWalkIns(data.walkIns || []);
      setCurrentOccupancy(data.currentActiveVisitors || 0);
      setIsFamilyActive(!!data.isFamilySessionActive);
      setActiveFamily(data.activeFamilyDetails || null);
      if (data.maxCapacity) setMaxCapacity(data.maxCapacity);
      if (data.defaultRate) setRatePerHour(data.defaultRate);
      if (data.remainingSpots !== undefined) {
        setRemainingSpots(data.remainingSpots);
      } else {
        setRemainingSpots(Math.max(0, (data.maxCapacity || 25) - (data.currentActiveVisitors || 0)));
      }
    } catch (err) {
      console.error("Error loading walk-ins", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalkIns();
    // Live refresh every 20 seconds to keep occupancy and countdowns accurate
    const pollInterval = setInterval(() => {
      fetchWalkIns(true);
    }, 20000);
    return () => clearInterval(pollInterval);
  }, [fetchWalkIns]);

  const calculatedCharge = Math.round(visitorCount * durationHours * ratePerHour);

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/walkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: entryMode === "QUICK" ? "QUICK_ENTRY" : "CHECK_IN",
          visitorCount,
          durationHours,
          ratePerHour,
          collectedAmount: calculatedCharge,
          paymentMethod,
          customerName: entryMode === "FULL" ? customerName : undefined,
          customerPhone: entryMode === "FULL" ? customerPhone : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log walk-in.");
      }

      setSuccessMsg(
        `${visitorCount} Swimmer${visitorCount > 1 ? "s" : ""} admitted for ${durationHours} hr! Collected ₹${calculatedCharge} via ${paymentMethod}.`
      );
      if (entryMode === "FULL") {
        setCustomerName("");
        setCustomerPhone("");
      }
      fetchWalkIns(true);
    } catch (err: any) {
      setFormError(err.message || "Failed to record walk-in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (walkInId: string) => {
    try {
      const res = await fetch("/api/admin/walkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHECK_OUT",
          walkInId,
        }),
      });
      if (res.ok) {
        fetchWalkIns(true);
      }
    } catch (err) {
      console.error("Check-out error", err);
    }
  };

  const filteredWalkIns = walkIns.filter((w) => {
    if (tableFilter === "ACTIVE") return w.status === "ACTIVE";
    if (tableFilter === "CHECKED_OUT") return w.status === "CHECKED_OUT";
    return true;
  });

  const occupancyPercent = Math.min(100, Math.round((currentOccupancy / maxCapacity) * 100));

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Pool Occupancy & Capacity Meter Card */}
      <div className="bg-white rounded-3xl p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#1D68BD] flex items-center justify-center">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900">Live Pool Occupancy</h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Live Counter
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Public hours: 09:00 AM – 04:00 PM • Standard Rate: ₹{ratePerHour}/person/hr
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <div className="text-lg font-black text-slate-900 tabular-nums">
                {currentOccupancy} <span className="text-xs font-semibold text-slate-400">/ {maxCapacity} Swimmers</span>
              </div>
              <div className={`text-[11px] font-bold ${remainingSpots > 5 ? "text-emerald-600" : remainingSpots > 0 ? "text-amber-600" : "text-rose-600"}`}>
                {remainingSpots > 0 ? `${remainingSpots} spots remaining` : "Pool at maximum capacity!"}
              </div>
            </div>
            <button
              onClick={() => fetchWalkIns()}
              disabled={loading}
              title="Refresh live occupancy"
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#1D68BD]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              occupancyPercent >= 90
                ? "bg-rose-500"
                : occupancyPercent >= 70
                ? "bg-amber-500"
                : "bg-[#1D68BD]"
            }`}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>

        {/* Active Private Family Session Alert */}
        {isFamilyActive && (
          <div className="mt-4 p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping shrink-0" />
              <div>
                <p className="font-extrabold text-xs">
                  Exclusive Family Session In Progress ({activeFamily?.guestCount || 0} Guests)
                </p>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Slot: {activeFamily?.startTime} – {activeFamily?.endTime} • Booked by: {activeFamily?.customerName || "Private Family Booking"}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black bg-purple-200 text-purple-900 uppercase tracking-wide shrink-0">
              100% Private Pool (Walk-ins Paused)
            </span>
          </div>
        )}
      </div>

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode 1: Full Check-in / Check-out */}
        <button
          type="button"
          onClick={() => setEntryMode("FULL")}
          className={`relative p-5 rounded-3xl text-left transition-all border ${
            entryMode === "FULL"
              ? "bg-[#F0F6FF] border-[#2563EB] shadow-[0_8px_25px_rgba(37,99,235,0.12)] ring-1 ring-[#2563EB]"
              : "bg-white border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] hover:border-slate-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                entryMode === "FULL" ? "bg-[#1D68BD] text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                Full Check-in / Check-out
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Track customer info, duration and entry/exit</p>
            </div>
            {entryMode === "FULL" && (
              <div className="w-6 h-6 rounded-full bg-[#1D68BD] text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>
        </button>

        {/* Mode 2: Quick Entry */}
        <button
          type="button"
          onClick={() => setEntryMode("QUICK")}
          className={`relative p-5 rounded-3xl text-left transition-all border ${
            entryMode === "QUICK"
              ? "bg-[#FAF5FF] border-[#9333EA] shadow-[0_8px_25px_rgba(147,51,234,0.12)] ring-1 ring-[#9333EA]"
              : "bg-white border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] hover:border-slate-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                entryMode === "QUICK" ? "bg-[#9333EA] text-white" : "bg-purple-50 text-[#9333EA]"
              }`}
            >
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">Quick Entry</h3>
              <p className="text-xs text-slate-500 mt-0.5">Fast-track admission & instant payment</p>
            </div>
            {entryMode === "QUICK" && (
              <div className="w-6 h-6 rounded-full bg-[#9333EA] text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {formError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-semibold">{formError}</span>
          </div>
          <button onClick={() => setFormError(null)} className="text-red-600 hover:text-red-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Admission Form */}
      <form onSubmit={handleEntrySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Visitor Details Card */}
        <div className="bg-white rounded-3xl p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4">
          <h2 className="font-extrabold text-slate-900 text-sm">Visitor Details</h2>

          {/* Stepper: No. of Visitors * */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              No. of Visitors <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5">
              <button
                type="button"
                onClick={() => setVisitorCount(Math.max(1, visitorCount - 1))}
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 font-bold flex items-center justify-center shadow-xs transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="text-center">
                <span className="font-black text-lg text-slate-900 tabular-nums">
                  {visitorCount}
                </span>
                <span className="text-[11px] text-slate-400 font-medium ml-1.5">
                  {visitorCount === 1 ? "Person" : "People"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setVisitorCount(visitorCount + 1)}
                className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 font-bold flex items-center justify-center shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Session Duration <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 1.5, 2, 3].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setDurationHours(dur)}
                  className={`py-2.5 rounded-xl text-xs font-extrabold border transition ${
                    durationHours === dur
                      ? "bg-[#1D68BD] text-white border-[#1D68BD] shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {dur} {dur === 1 ? "Hour" : "Hours"}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Name & Phone (shown in FULL mode) */}
          {entryMode === "FULL" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">Customer Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Rahul"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">Mobile Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* Entry Time */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Entry Time <span className="text-slate-400 font-normal">(Current Time)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={entryTime}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 cursor-default"
              />
              <Clock className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right Column: Payment Details Card */}
        <div className="bg-white rounded-3xl p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="font-extrabold text-slate-900 text-sm">Payment Details</h2>

            {/* Amount (Auto Breakdown) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Amount (Auto-calculated: {visitorCount} × {durationHours}h × ₹{ratePerHour})
              </label>
              <div className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Total Charge</span>
                <span className="text-lg font-black text-slate-900">₹{calculatedCharge}</span>
              </div>
            </div>

            {/* Payment Method * */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as "UPI" | "CASH")}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition appearance-none"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash Counter</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Big Solid Check In Button */}
          <button
            type="submit"
            disabled={submitting || isFamilyActive}
            className={`w-full text-white font-extrabold py-3.5 rounded-2xl shadow-md transition-all text-sm mt-3 ${
              isFamilyActive
                ? "bg-slate-400 cursor-not-allowed shadow-none"
                : entryMode === "QUICK"
                ? "bg-[#9333EA] hover:bg-[#7e22ce] shadow-purple-700/20"
                : "bg-[#1D68BD] hover:bg-[#155299] shadow-blue-700/20"
            }`}
          >
            {isFamilyActive
              ? "Cannot Admit: Pool Reserved for Family Session"
              : submitting
              ? "Admitting Swimmers..."
              : `Check In (${visitorCount} Swimmers • ₹${calculatedCharge})`}
          </button>
        </div>
      </form>

      {/* Today's Walk-in Visitors & Live Countdown Ledger */}
      <div className="bg-white rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900">Today's Walk-in Swimmers</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live capacity countdown, auto-checkout, and counter payment registry
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTableFilter("ALL")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                tableFilter === "ALL"
                  ? "bg-[#1D68BD] text-white"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setTableFilter("ACTIVE")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                tableFilter === "ACTIVE"
                  ? "bg-[#1D68BD] text-white"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              In Pool ({currentOccupancy})
            </button>
            <button
              type="button"
              onClick={() => setTableFilter("CHECKED_OUT")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                tableFilter === "CHECKED_OUT"
                  ? "bg-[#1D68BD] text-white"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              Checked Out
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && walkIns.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading walk-in entries...</div>
          ) : filteredWalkIns.length > 0 ? (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Customer / Swimmers</th>
                  <th className="px-5 py-3.5">Entry Time</th>
                  <th className="px-5 py-3.5">Duration</th>
                  <th className="px-5 py-3.5">Time Left</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWalkIns.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                          w.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {w.status === "ACTIVE" ? "In Pool" : "Checked Out"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">
                        {w.visitorCount} {w.visitorCount === 1 ? "Swimmer" : "Swimmers"}
                      </div>
                      {w.customerName && (
                        <div className="text-[11px] text-slate-500 font-medium">
                          {w.customerName} {w.customerPhone ? `(${w.customerPhone})` : ""}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-600">
                      {formatPoolTime(new Date(w.checkInTime), true)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{w.durationHours || 1} hr</td>
                    <td className="px-5 py-3.5">
                      {w.status === "ACTIVE" ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            w.remainingMinutes <= 5
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : w.remainingMinutes <= 15
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-sky-50 text-sky-700 border border-sky-200"
                          }`}
                        >
                          <Hourglass className="w-3 h-3" />
                          {w.remainingMinutes > 0 ? `${w.remainingMinutes}m left` : "Ending now"}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Completed</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-slate-900 tabular-nums">
                      ₹{w.collectedAmount}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          w.paymentMethod === "UPI"
                            ? "bg-purple-50 text-purple-700 border border-purple-200/80"
                            : "bg-blue-50 text-blue-700 border border-blue-200/80"
                        }`}
                      >
                        {w.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {w.status === "ACTIVE" ? (
                        <button
                          onClick={() => handleCheckOut(w.id)}
                          className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-xs transition"
                        >
                          Check Out
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No walk-in visitors recorded today.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
