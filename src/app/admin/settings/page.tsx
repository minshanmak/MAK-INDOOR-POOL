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
  Users,
  Power,
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
      setFeedback({
        type: "success",
        msg: "Pool system settings updated! Authoritative rules have taken effect immediately.",
      });
      fetchSettings();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-mono">
        <div className="inline-flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading pool configuration parameters...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Save Trigger */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-800 font-semibold mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>OWNER-EXCLUSIVE GOVERNANCE CONTROLS</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">System Settings & Rules</h1>
          <p className="text-xs text-slate-500">
            Configure rates, operating schedules, public capacity, cutoffs, and emergency maintenance mode
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? "Saving Changes..." : "Save Configuration"}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Module 1: Pricing Rates */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <IndianRupee className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Authoritative Pricing Engine Rates
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Public Swimming Rate (₹ / person / hr)
              </label>
              <input
                type="number"
                min={50}
                required
                value={settings?.publicRatePerHour || 150}
                onChange={(e) =>
                  setSettings({ ...settings, publicRatePerHour: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Default: ₹150</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Family Base Rate (₹ / hr up to 12 people)
              </label>
              <input
                type="number"
                min={500}
                required
                value={settings?.familyBaseRatePerHour || 1500}
                onChange={(e) =>
                  setSettings({ ...settings, familyBaseRatePerHour: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Default: ₹1,500</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Family Extra Guest Rate (₹ / extra guest / hr)
              </label>
              <input
                type="number"
                min={0}
                required
                value={settings?.familyExtraPersonRate || 100}
                onChange={(e) =>
                  setSettings({ ...settings, familyExtraPersonRate: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Default: ₹100 / extra person / hr</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Required Family Online Advance (₹)
              </label>
              <input
                type="number"
                min={100}
                required
                value={settings?.familyAdvanceRequired || 750}
                onChange={(e) =>
                  setSettings({ ...settings, familyAdvanceRequired: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Mandatory advance to hold slot (balance collected at counter)
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Public Swimmer Maximum Capacity
              </label>
              <input
                type="number"
                min={5}
                max={100}
                required
                value={settings?.maxPublicCapacity || 25}
                onChange={(e) =>
                  setSettings({ ...settings, maxPublicCapacity: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Concurrently monitored on walk-in counter
              </span>
            </div>
          </div>
        </div>

        {/* Module 2: Operating Sessions Schedule */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="w-4 h-4 text-cyan-600" />
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Operating Hours & Session Division
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Overall Facility Hours
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={settings?.openingTime || "09:00"}
                  onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
                <span className="text-slate-400 text-xs font-mono">to</span>
                <input
                  type="time"
                  value={settings?.closingTime || "23:00"}
                  onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Public Swimming Window
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={settings?.publicStart || "09:00"}
                  onChange={(e) => setSettings({ ...settings, publicStart: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
                <span className="text-slate-400 text-xs font-mono">to</span>
                <input
                  type="time"
                  value={settings?.publicEnd || "16:00"}
                  onChange={(e) => setSettings({ ...settings, publicEnd: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Family Exclusive Window
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={settings?.familyStart || "16:00"}
                  onChange={(e) => setSettings({ ...settings, familyStart: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
                <span className="text-slate-400 text-xs font-mono">to</span>
                <input
                  type="time"
                  value={settings?.familyEnd || "23:00"}
                  onChange={(e) => setSettings({ ...settings, familyEnd: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Module 3: Cutoffs & Safety Mode */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-amber-600" />
            <h2 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Booking Windows & Maintenance Emergency
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Advance Booking Window (Days)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={settings?.advanceBookingDays || 30}
                onChange={(e) =>
                  setSettings({ ...settings, advanceBookingDays: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Same-Day Cutoff Notice (Hours)
              </label>
              <input
                type="number"
                min={0}
                max={24}
                value={settings?.sameDayCutoffHours || 2}
                onChange={(e) =>
                  setSettings({ ...settings, sameDayCutoffHours: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Temporary Slot Hold TTL (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={settings?.slotHoldMinutes || 15}
                onChange={(e) =>
                  setSettings({ ...settings, slotHoldMinutes: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs text-slate-900"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block text-xs">
                Emergency Maintenance Mode
              </span>
              <span className="text-[11px] text-slate-500">
                Immediately suspends all new online reservations and alerts visitors
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                setSettings({ ...settings, maintenanceMode: !settings?.maintenanceMode })
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                settings?.maintenanceMode
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{settings?.maintenanceMode ? "ENABLED (POOL CLOSED)" : "NORMAL OPERATION"}</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs shadow-xs transition"
          >
            {saving ? "Saving Changes..." : "Save All System Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
