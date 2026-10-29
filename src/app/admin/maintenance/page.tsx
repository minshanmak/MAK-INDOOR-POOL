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
  Wrench,
} from "lucide-react";

export default function AdminMaintenancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Water Reading Form State
  const [chlorinePpm, setChlorinePpm] = useState(2.0);
  const [phLevel, setPhLevel] = useState(7.4);
  const [waterClarity, setWaterClarity] = useState("CLEAR");
  const [readingRemarks, setReadingRemarks] = useState("");
  const [readingSubmitting, setReadingSubmitting] = useState(false);

  // Safety Diagnostic Helpers
  const getChlorineTolerance = (val: number) => {
    if (val < 1.0) {
      return {
        label: "Critical Low",
        detail: "Unsanitary risk; dose sodium hypochlorite immediately",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
        indicatorColor: "bg-rose-500",
      };
    }
    if (val < 1.5) {
      return {
        label: "Low (Sub-optimal)",
        detail: "Below target; increase chlorination rate",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
        indicatorColor: "bg-amber-500",
      };
    }
    if (val <= 3.0) {
      return {
        label: "Optimal (Sanitary)",
        detail: "Ideal sanitary range (1.5–3.0 ppm)",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
        indicatorColor: "bg-emerald-500",
      };
    }
    return {
      label: "Elevated / High",
      detail: "Eye & skin irritation risk; pause chlorinator",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
      indicatorColor: "bg-rose-500",
    };
  };

  const getPhTolerance = (val: number) => {
    if (val < 7.2) {
      return {
        label: "Acidic (Corrosive)",
        detail: "Corrosive to tile grout & pipes; add soda ash",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
        indicatorColor: "bg-rose-500",
      };
    }
    if (val <= 7.6) {
      return {
        label: "Optimal Balance",
        detail: "Maximum bather comfort & UV efficacy (7.2–7.6)",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
        indicatorColor: "bg-emerald-500",
      };
    }
    return {
      label: "Alkaline (Scale-forming)",
      detail: "Causes cloudy water and reduces sanitizer power",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      indicatorColor: "bg-amber-500",
    };
  };

  const clTolerance = getChlorineTolerance(chlorinePpm);
  const phTolerance = getPhTolerance(phLevel);

  // Checklist Form State
  const [shift, setShift] = useState<"MORNING" | "EVENING">("MORNING");
  const [poolCleaned, setPoolCleaned] = useState(true);
  const [surroundingsCleaned, setSurroundingsCleaned] = useState(true);
  const [deckSanitized, setDeckSanitized] = useState(true);
  const [skimmerCleaned, setSkimmerCleaned] = useState(true);
  const [filtersChecked, setFiltersChecked] = useState(true);
  const [safetyGearChecked, setSafetyGearChecked] = useState(true);
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

  const handleReportIssue = async (e: React.FormEvent) => {
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
      <div className="p-12 text-center text-slate-400 text-xs font-mono">
        <div className="inline-flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading water telemetry & maintenance audit records...</span>
        </div>
      </div>
    );
  }

  const { readings = [], checklists = [], issues = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200/90 pb-4">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-800 font-semibold mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>WATER HYGIENE & PLANT SAFETY GOVERNANCE</span>
        </div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Maintenance & Water Safety</h1>
        <p className="text-xs text-slate-500">
          Twice-daily chlorine/pH testing, shift cleaning checklists, and plant defect inspection logs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Module 1: Water Reading Form & Logs */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-700" />
              <span>Log Water Quality Chemical Test</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              Target: Cl 1.5–3.0 ppm | pH 7.2–7.6
            </span>
          </div>

          <form onSubmit={handleWaterReadingSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-slate-700 text-[11px]">Chlorine (ppm) *</label>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${clTolerance.badgeClass}`}
                  >
                    {clTolerance.label}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={chlorinePpm}
                  onChange={(e) => setChlorinePpm(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
                <p className="text-[10px] text-slate-500 leading-tight">
                  {clTolerance.detail}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-slate-700 text-[11px]">pH Level *</label>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono border ${phTolerance.badgeClass}`}
                  >
                    {phTolerance.label}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={phLevel}
                  onChange={(e) => setPhLevel(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
                />
                <p className="text-[10px] text-slate-500 leading-tight">
                  {phTolerance.detail}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-slate-700 text-[11px]">Water Clarity</label>
                  <span className="text-[9px] font-mono text-slate-400">Visual index</span>
                </div>
                <select
                  value={waterClarity}
                  onChange={(e) => setWaterClarity(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="CLEAR">Crystal Clear</option>
                  <option value="SLIGHTLY_HAZY">Slightly Hazy</option>
                  <option value="HAZY">Hazy</option>
                  <option value="TURBID">Turbid (Alert)</option>
                </select>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Target: 1.8m deep basin floor clearly visible
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Remarks / Chemical Dosing Adjustments
              </label>
              <input
                type="text"
                value={readingRemarks}
                onChange={(e) => setReadingRemarks(e.target.value)}
                placeholder="e.g. Backwashed sand filters; added 200g sodium bicarbonate"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={readingSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs shadow-xs transition"
            >
              {readingSubmitting ? "Logging Test..." : "Record Water Quality Test"}
            </button>
          </form>

          {/* Recent Readings List */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Recent Water Audits
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {readings.map((r: any) => (
                <div
                  key={r.id}
                  className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg flex justify-between items-center text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          r.status === "OPTIMAL"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {r.status}
                      </span>
                      <strong className="text-slate-900 font-mono text-xs tabular-nums">
                        Cl: {r.chlorinePpm} ppm • pH: {r.phLevel}
                      </strong>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {r.date} at {r.time} by {r.staffUser?.name || "Staff"} ({r.waterClarity})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Module 2: Shift Cleaning Checklist */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>Shift Cleaning Checklist Signoff</span>
            </h2>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as any)}
              className="px-2 py-1 border border-slate-300 rounded text-xs font-bold"
            >
              <option value="MORNING">Morning Shift</option>
              <option value="EVENING">Evening Shift</option>
            </select>
          </div>

          <form onSubmit={handleChecklistSubmit} className="space-y-3 text-xs">
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={poolCleaned}
                  onChange={(e) => setPoolCleaned(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span className="font-semibold text-slate-800">
                  Pool surface vacuumed & skimmer baskets cleared
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deckSanitized}
                  onChange={(e) => setDeckSanitized(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span className="font-semibold text-slate-800">
                  Pool deck tiles washed and scrubbed with disinfectant
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={surroundingsCleaned}
                  onChange={(e) => setSurroundingsCleaned(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span className="font-semibold text-slate-800">
                  Changing rooms, hot showers & toilets sanitized
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtersChecked}
                  onChange={(e) => setFiltersChecked(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span className="font-semibold text-slate-800">
                  Sand filter pressure gauges checked & UV lamps inspected
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={safetyGearChecked}
                  onChange={(e) => setSafetyGearChecked(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <span className="font-semibold text-slate-800">
                  Lifebuoys, reach poles & first-aid kits verified on deck
                </span>
              </label>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Shift Notes & Handover Remarks
              </label>
              <input
                type="text"
                value={checklistNotes}
                onChange={(e) => setChecklistNotes(e.target.value)}
                placeholder="All items verified; facility ready for swimmers"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={checklistSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs shadow-xs transition"
            >
              {checklistSubmitting ? "Signing Off..." : `Sign Off ${shift} Cleaning Checklist`}
            </button>
          </form>

          {/* Recent Checklists History */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Recent Shift Signoffs
            </h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {checklists.map((c: any) => (
                <div
                  key={c.id}
                  className="p-2 bg-slate-50 border border-slate-200/80 rounded-lg flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">
                      {c.date} • {c.shift} Shift
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Signed off by {c.staffUser?.name || "Staff"}
                    </span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Module 3: Maintenance Issues & Equipment Defect Tracker */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Plant & Equipment Defect Tracker ({issues.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Report pumps, filtration valves, geysers, or deck fixtures needing service
            </p>
          </div>
        </div>

        <form onSubmit={handleReportIssue} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-end">
          <div className="sm:col-span-4">
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Issue Title *</label>
            <input
              type="text"
              required
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              placeholder="e.g. Pump #2 pressure drop"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">Severity Level</label>
            <select
              value={issueSeverity}
              onChange={(e) => setIssueSeverity(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium"
            >
              <option value="LOW">Low (Cosmetic / Deck fixture)</option>
              <option value="MEDIUM">Medium (Filter or valve maintenance)</option>
              <option value="HIGH">High (Immediate intervention required)</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={issueSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs shadow-xs transition"
            >
              {issueSubmitting ? "Logging..." : "+ Log Defect Ticket"}
            </button>
          </div>
        </form>

        {issues.length > 0 && (
          <div className="divide-y divide-slate-100 border-t border-slate-100 pt-3 text-xs">
            {issues.map((iss: any) => (
              <div key={iss.id} className="py-2.5 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        iss.severity === "HIGH"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : iss.severity === "MEDIUM"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {iss.severity}
                    </span>
                    <strong className="text-slate-900">{iss.title}</strong>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Reported on {new Date(iss.createdAt).toLocaleDateString()} • Status: {iss.status}
                  </span>
                </div>

                {iss.status !== "RESOLVED" ? (
                  <button
                    onClick={() => handleResolveIssue(iss.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] px-2.5 py-1 rounded transition"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <span className="text-emerald-700 text-[11px] font-semibold">Resolved</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
