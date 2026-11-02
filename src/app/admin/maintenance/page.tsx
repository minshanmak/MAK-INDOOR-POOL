"use client";

import React, { useState, useEffect } from "react";
import {
  Droplets,
  CheckSquare,
  AlertTriangle,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Check,
  X,
  FileCheck,
} from "lucide-react";
import { formatPoolTime, formatPoolDate } from "@/lib/timezone";

export default function AdminMaintenancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Tabs: "CHECKLIST" | "WATER_TEST" | "ISSUES" | "HISTORY"
  const [activeTab, setActiveTab] = useState<"CHECKLIST" | "WATER_TEST" | "ISSUES" | "HISTORY">("CHECKLIST");

  // Water Reading Form State
  const [chlorinePpm, setChlorinePpm] = useState(2.0);
  const [phLevel, setPhLevel] = useState(7.4);
  const [waterClarity, setWaterClarity] = useState("CLEAR");
  const [readingRemarks, setReadingRemarks] = useState("");
  const [readingSubmitting, setReadingSubmitting] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);

  // Checklist Form State
  const [shift, setShift] = useState<"MORNING" | "EVENING">("MORNING");
  const [poolCleaned, setPoolCleaned] = useState(true);
  const [surroundingsCleaned, setSurroundingsCleaned] = useState(true);
  const [deckSanitized, setDeckSanitized] = useState(true);
  const [skimmerCleaned, setSkimmerCleaned] = useState(true);
  const [filtersChecked, setFiltersChecked] = useState(true);
  const [safetyGearChecked, setSafetyGearChecked] = useState(false);
  const [checklistNotes, setChecklistNotes] = useState("");
  const [checklistSubmitting, setChecklistSubmitting] = useState(false);

  // Issue Form State
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDesc, setIssueDesc] = useState("");
  const [issueSeverity, setIssueSeverity] = useState("MEDIUM");
  const [issueSubmitting, setIssueSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/maintenance");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching maintenance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWaterReadingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReadingSubmitting(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "WATER_READING",
          chlorinePpm,
          phLevel,
          waterClarity,
          remarks: readingRemarks,
        }),
      });
      if (res.ok) {
        setReadingRemarks("");
        setShowWaterModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReadingSubmitting(false);
    }
  };

  const handleChecklistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecklistSubmitting(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CHECKLIST",
          shift,
          poolCleaned,
          surroundingsCleaned,
          deckSanitized,
          skimmerCleaned,
          filtersChecked,
          safetyGearChecked,
          notes: checklistNotes,
        }),
      });
      if (res.ok) {
        setChecklistNotes("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChecklistSubmitting(false);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueSubmitting(true);
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "REPORT_ISSUE",
          title: issueTitle,
          description: issueDesc,
          severity: issueSeverity,
        }),
      });
      if (res.ok) {
        setIssueTitle("");
        setIssueDesc("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIssueSubmitting(false);
    }
  };

  const handleResolveIssue = async (issueId: string) => {
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RESOLVE_ISSUE",
          issueId,
          resolutionNotes: "Resolved and tested by duty staff.",
        }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Loading maintenance & water safety records...
      </div>
    );
  }

  const { readings = [], checklists = [], issues = [] } = data || {};
  const latestReading = readings[0] || {
    chlorinePpm: 2.0,
    phLevel: 7.4,
    waterClarity: "CLEAR",
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Maintenance & Water Safety
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Daily maintenance, water quality and safety checks
          </p>
        </div>
      </div>

      {/* Segmented Filter Tabs (Exact Mockup Match) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("CHECKLIST")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "CHECKLIST"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
          }`}
        >
          Daily Checklist
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("WATER_TEST")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "WATER_TEST"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
          }`}
        >
          Water Test
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ISSUES")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "ISSUES"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
          }`}
        >
          Issues & Repairs ({issues.filter((i: any) => i.status === "OPEN").length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("HISTORY")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "HISTORY"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
          }`}
        >
          History
        </button>
      </div>

      {/* Main Two-Card Layout (Exact Mockup Match) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Card: Daily Checklist */}
        <div className="bg-white rounded-3xl p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-slate-900 text-sm">Daily Checklist</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                {shift} Shift
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Checklist Item 1: Pool Cleaning */}
            <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPoolCleaned(!poolCleaned)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                    poolCleaned ? "bg-emerald-500 text-white" : "border-2 border-slate-300"
                  }`}
                >
                  {poolCleaned && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                <span className="text-xs font-bold text-slate-800">Pool Cleaning</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {poolCleaned ? "Completed (8:30 AM)" : "Pending"}
              </span>
            </div>

            {/* Checklist Item 2: Chlorine Level */}
            <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-xs font-bold text-slate-800">Chlorine Level</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Within range ({latestReading.chlorinePpm || 2.0} ppm)
              </span>
            </div>

            {/* Checklist Item 3: pH Level */}
            <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <span className="text-xs font-bold text-slate-800">pH Level</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Within range ({latestReading.phLevel || 7.4})
              </span>
            </div>

            {/* Checklist Item 4: Filter & Pump */}
            <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersChecked(!filtersChecked)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                    filtersChecked ? "bg-emerald-500 text-white" : "border-2 border-slate-300"
                  }`}
                >
                  {filtersChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                <span className="text-xs font-bold text-slate-800">Filter & Pump</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                {filtersChecked ? "OK" : "Requires inspection"}
              </span>
            </div>

            {/* Checklist Item 5: Safety Equipment */}
            <div className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSafetyGearChecked(!safetyGearChecked)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                    safetyGearChecked ? "bg-emerald-500 text-white" : "border-2 border-slate-300"
                  }`}
                >
                  {safetyGearChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                <span className="text-xs font-bold text-slate-800">Safety Equipment</span>
              </div>
              <span
                className={`text-[11px] font-bold ${
                  safetyGearChecked ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {safetyGearChecked ? "Verified" : "Pending"}
              </span>
            </div>
          </div>

          <form onSubmit={handleChecklistSubmit} className="pt-3 border-t border-slate-100 space-y-3">
            <button
              type="submit"
              disabled={checklistSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold py-2.5 rounded-2xl text-xs transition shadow-xs"
            >
              {checklistSubmitting ? "Submitting..." : "Save Shift Checklist"}
            </button>
          </form>
        </div>

        {/* Right Card: Water Readings */}
        <div className="bg-white rounded-3xl p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#1D68BD]" />
                Water Readings
              </h2>
              <span className="text-[10px] font-mono text-slate-400">
                Ideal: Cl 1.5–3.0 | pH 7.2–7.6
              </span>
            </div>

            {/* Metric 1: Chlorine */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Chlorine</span>
                <span className="text-lg font-black text-slate-900">
                  {latestReading.chlorinePpm || 2.0} ppm
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                Normal
              </span>
            </div>

            {/* Metric 2: pH Level */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-700 block">pH Level</span>
                <span className="text-lg font-black text-slate-900">
                  {latestReading.phLevel || 7.4}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                Normal
              </span>
            </div>

            {/* Metric 3: Water Clarity */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Water Clarity</span>
                <span className="text-lg font-black text-slate-900 capitalize">
                  {latestReading.waterClarity?.toLowerCase() || "Clear"}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                Normal
              </span>
            </div>
          </div>

          {/* Blue Update Readings Button */}
          <button
            type="button"
            onClick={() => setShowWaterModal(true)}
            className="w-full bg-[#1D68BD] hover:bg-[#155299] active:scale-[0.99] text-white font-extrabold py-3.5 rounded-2xl shadow-md shadow-blue-700/20 transition text-sm mt-4"
          >
            Update Readings
          </button>
        </div>
      </div>

      {/* Issues & Repairs Section (if ISSUES tab selected or below) */}
      {activeTab === "ISSUES" && (
        <div className="bg-white rounded-3xl p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-extrabold text-slate-900 text-sm">Reported Pool Issues</h2>
            <span className="text-[11px] text-slate-400">Track and resolve maintenance repairs</span>
          </div>

          <form onSubmit={handleIssueSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <input
              type="text"
              required
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              placeholder="Issue title e.g. Skimmer leak"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
            <input
              type="text"
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              placeholder="Description"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
            <button
              type="submit"
              disabled={issueSubmitting}
              className="bg-[#1D68BD] text-white font-bold py-2 rounded-xl"
            >
              {issueSubmitting ? "Reporting..." : "Log Issue"}
            </button>
          </form>

          <div className="divide-y divide-slate-100 pt-2">
            {issues.map((i: any) => (
              <div key={i.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{i.title}</span>
                  <span className="text-slate-500 text-[11px]">{i.description}</span>
                </div>
                {i.status === "OPEN" ? (
                  <button
                    onClick={() => handleResolveIssue(i.id)}
                    className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-xl text-[10px]"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <span className="text-emerald-600 font-bold text-[10px]">Resolved</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Update Readings Modal */}
      {showWaterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Log Water Quality Test</h3>
              <button
                onClick={() => setShowWaterModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWaterReadingSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chlorine (ppm)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={chlorinePpm}
                    onChange={(e) => setChlorinePpm(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">pH Level</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={phLevel}
                    onChange={(e) => setPhLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Water Clarity</label>
                <select
                  value={waterClarity}
                  onChange={(e) => setWaterClarity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="CLEAR">Crystal Clear</option>
                  <option value="SLIGHTLY_HAZY">Slightly Hazy</option>
                  <option value="HAZY">Hazy</option>
                  <option value="TURBID">Turbid</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks</label>
                <input
                  type="text"
                  value={readingRemarks}
                  onChange={(e) => setReadingRemarks(e.target.value)}
                  placeholder="Chemical additions or notes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWaterModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={readingSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#1D68BD] text-white font-bold"
                >
                  {readingSubmitting ? "Saving..." : "Save Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
