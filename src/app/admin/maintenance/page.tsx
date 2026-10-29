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
    return <div className="p-8 text-center text-slate-400 text-xs">Loading maintenance & water safety records...</div>;
  }

  const { readings = [], checklists = [], issues = [] } = data || {};

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Maintenance & Water Safety</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Twice-daily chlorine/pH testing, shift cleaning checklists, and equipment inspection logs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Water Reading Form & Logs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Droplets className="w-4 h-4 text-ocean-600" />
              Log Water Quality Test
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">
              Ideal: Cl 1.5–3.0 ppm | pH 7.2–7.6
            </span>
          </div>

          <form onSubmit={handleWaterReadingSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chlorine (ppm) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={chlorinePpm}
                  onChange={(e) => setChlorinePpm(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">pH Level *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={phLevel}
                  onChange={(e) => setPhLevel(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Water Clarity</label>
                <select
                  value={waterClarity}
                  onChange={(e) => setWaterClarity(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="CLEAR">Crystal Clear</option>
                  <option value="SLIGHTLY_HAZY">Slightly Hazy</option>
                  <option value="HAZY">Hazy</option>
                  <option value="TURBID">Turbid (Alert)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Remarks / Chemical Adjustments</label>
              <input
                type="text"
                value={readingRemarks}
                onChange={(e) => setReadingRemarks(e.target.value)}
                placeholder="e.g. Added 200g sodium bicarbonate / backwash performed"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={readingSubmitting}
              className="w-full bg-ocean-600 hover:bg-ocean-700 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              {readingSubmitting ? "Logging..." : "Record Water Reading"}
            </button>
          </form>

          {/* Recent Readings List */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 mb-2">Recent Readings History</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {readings.map((r: any) => (
                <div key={r.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        r.status === "OPTIMAL" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {r.status}
                      </span>
                      <strong className="text-slate-900 font-mono">Cl: {r.chlorinePpm} ppm | pH: {r.phLevel}</strong>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              Daily Shift Cleaning Checklist
            </h2>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as any)}
              className="px-2 py-1 border border-slate-300 rounded text-xs font-semibold"
            >
              <option value="MORNING">Morning Shift</option>
              <option value="EVENING">Evening Shift</option>
            </select>
          </div>

          <form onSubmit={handleChecklistSubmit} className="space-y-3 text-xs">
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={poolCleaned}
                  onChange={(e) => setPoolCleaned(e.target.checked)}
                  className="rounded text-ocean-600 focus:ring-ocean-500"
                />
                <span className="font-medium text-slate-800">Pool surface vacuumed & skimmer nets cleaned</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={surroundingsCleaned}
                  onChange={(e) => setSurroundingsCleaned(e.target.checked)}
                  className="rounded text-ocean-600 focus:ring-ocean-500"
                />
                <span className="font-medium text-slate-800">Deck tile floor scrubbed & disinfected</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deckSanitized}
                  onChange={(e) => setDeckSanitized(e.target.checked)}
                  className="rounded text-ocean-600 focus:ring-ocean-500"
                />
                <span className="font-medium text-slate-800">Changing rooms & shower stalls sanitized</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtersChecked}
                  onChange={(e) => setFiltersChecked(e.target.checked)}
                  className="rounded text-ocean-600 focus:ring-ocean-500"
                />
                <span className="font-medium text-slate-800">Sand filter pressure gauge inspected</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={safetyGearChecked}
                  onChange={(e) => setSafetyGearChecked(e.target.checked)}
                  className="rounded text-ocean-600 focus:ring-ocean-500"
                />
                <span className="font-medium text-slate-800">Life rings, ropes & kids vests in position</span>
              </label>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Checklist Notes</label>
              <input
                type="text"
                value={checklistNotes}
                onChange={(e) => setChecklistNotes(e.target.value)}
                placeholder="Optional shift notes"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={checklistSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition"
            >
              {checklistSubmitting ? "Signing Off..." : `Sign Off ${shift} Checklist`}
            </button>
          </form>

          {/* Recent Checklists History */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 mb-2">Signed Checklists</h3>
            <div className="space-y-1.5 max-h-40 overflow-y-auto text-xs">
              {checklists.map((c: any) => (
                <div key={c.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                  <span className="font-semibold text-slate-800">
                    {c.date} ({c.shift}) — Completed
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {c.staffUser?.name || "Staff"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Module 3: Maintenance Issues Log */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Report Maintenance Issue / Equipment Defect
          </h2>
        </div>

        <form onSubmit={handleIssueSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="sm:col-span-2">
            <input
              type="text"
              required
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              placeholder="Issue title e.g. Pool light bulb replaced / pump pressure high"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <select
              value={issueSeverity}
              onChange={(e) => setIssueSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="LOW">Low Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="HIGH">High Severity</option>
              <option value="CRITICAL">Critical (Pool Closure)</option>
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={issueSubmitting}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg"
            >
              Log Issue
            </button>
          </div>
          <div className="sm:col-span-4">
            <textarea
              rows={2}
              required
              value={issueDesc}
              onChange={(e) => setIssueDesc(e.target.value)}
              placeholder="Detailed description of defect, affected equipment, and corrective action required..."
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
            />
          </div>
        </form>

        {/* Issues List */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          {issues.map((i: any) => (
            <div key={i.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-start text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    i.status === "RESOLVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : i.severity === "CRITICAL"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {i.status} ({i.severity})
                  </span>
                  <strong className="text-slate-900">{i.title}</strong>
                </div>
                <p className="text-slate-600 mt-1">{i.description}</p>
                {i.resolutionNotes && (
                  <p className="text-emerald-700 text-[11px] mt-1 font-semibold">
                    Resolution: {i.resolutionNotes}
                  </p>
                )}
              </div>
              <div>
                {i.status !== "RESOLVED" && (
                  <button
                    onClick={() => handleResolveIssue(i.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[11px]"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

