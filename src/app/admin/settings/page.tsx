"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
  Shield,
  IndianRupee,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      setSettings(json.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update settings.");
      }
      setFeedback({ type: "success", msg: "Pool system settings updated and applied authoritative rules!" });
      fetchSettings();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading system settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Settings & Policies</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Owner-only controls for pricing rules, operating schedules, public capacity, cutoffs, and maintenance mode
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
          feedback.type === "success"
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Module A: Pricing Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-sm">Authoritative Pricing Engine Rates</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Default Public Swimming Rate (₹ / hr / person)
              </label>
              <input
                type="number"
                min={1}
                required
                value={settings.defaultPublicRate}
                onChange={(e) => setSettings({ ...settings, defaultPublicRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Family Base Rate (₹ / hr up to 12 persons)
              </label>
              <input
                type="number"
                min={100}
                required
                value={settings.defaultFamilyBaseRate}
                onChange={(e) => setSettings({ ...settings, defaultFamilyBaseRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Extra Guest Charge (₹ / hr for each above 12)
              </label>
              <input
                type="number"
                min={0}
                required
                value={settings.familyExtraRate}
                onChange={(e) => setSettings({ ...settings, familyExtraRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Family Online Advance Deposit (₹)
              </label>
              <input
                type="number"
                min={100}
                required
                value={settings.familyAdvanceAmount}
                onChange={(e) => setSettings({ ...settings, familyAdvanceAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Checkout Slot Hold Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                required
                value={settings.holdTtlMinutes}
                onChange={(e) => setSettings({ ...settings, holdTtlMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Maximum Concurrent Public Pool Capacity
              </label>
              <input
                type="number"
                min={5}
                max={50}
                required
                value={settings.maxCapacity}
                onChange={(e) => setSettings({ ...settings, maxCapacity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Module B: Operational Hours & Cutoffs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-5 h-5 text-ocean-600" />
            <h2 className="font-bold text-slate-900 text-sm">Operating Hours & Customer Cutoffs</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pool Opening Hour (AM)</label>
              <input
                type="number"
                min={6}
                max={12}
                required
                value={settings.openHour}
                onChange={(e) => setSettings({ ...settings, openHour: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <span className="text-[10px] text-slate-400">Default: 9:00 AM</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Public Shift End (24h)</label>
              <input
                type="number"
                min={12}
                max={20}
                required
                value={settings.publicEndHour}
                onChange={(e) => setSettings({ ...settings, publicEndHour: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <span className="text-[10px] text-slate-400">Default: 16 (4:00 PM)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pool Closing Hour (24h)</label>
              <input
                type="number"
                min={18}
                max={24}
                required
                value={settings.closeHour}
                onChange={(e) => setSettings({ ...settings, closeHour: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <span className="text-[10px] text-slate-400">Default: 23 (11:00 PM)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cancellation Cutoff (Hours)</label>
              <input
                type="number"
                min={1}
                required
                value={settings.cancellationCutoffHours}
                onChange={(e) => setSettings({ ...settings, cancellationCutoffHours: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <span className="text-[10px] text-slate-400">Default: 12 Hours</span>
            </div>
          </div>
        </div>

        {/* Module C: Emergency Maintenance Mode */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-slate-900 text-sm">Maintenance Mode & Operational Suspension</h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span className="font-bold text-slate-900">
                Enable Pool Maintenance Mode (Suspends public online booking)
              </span>
            </label>

            {settings.maintenanceMode && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Customer-facing Closure Notice
                </label>
                <input
                  type="text"
                  value={settings.maintenanceMessage || ""}
                  onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                  placeholder="e.g. Scheduled pool tile maintenance and deep water sterilization in progress. Re-opening tomorrow 9 AM."
                  className="w-full px-3 py-2 border border-amber-300 bg-amber-50 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-ocean-600 hover:bg-ocean-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save System Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
