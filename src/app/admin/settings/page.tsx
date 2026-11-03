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
  Building,
  Bell,
  Receipt,
  Database,
  RefreshCw,
  Sliders,
  Waves,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Sub-Navigation Tabs matching Mockup
  const [activeSection, setActiveSection] = useState<
    | "general"
    | "pricing"
    | "rules"
    | "hours"
    | "notifications"
    | "receipts"
    | "retention"
    | "backup"
    | "maintenance"
  >("general");

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
      setFeedback({ type: "success", msg: "Pool system settings updated successfully!" });
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

  const sections = [
    { id: "general", label: "General", icon: Building },
    { id: "pricing", label: "Pricing & Rates", icon: IndianRupee },
    { id: "rules", label: "Booking Rules", icon: Shield },
    { id: "hours", label: "Operational Hours", icon: Clock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "receipts", label: "Receipts", icon: Receipt },
    { id: "retention", label: "Data Retention", icon: Database },
    { id: "backup", label: "Backup & Recovery", icon: RefreshCw },
    { id: "maintenance", label: "Maintenance Mode", icon: Sliders },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
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
          <span className="font-semibold">{feedback.msg}</span>
        </div>
      )}

      {/* Main Two-Column Layout (Exact Mockup Match) */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Sub-Navigation Menu */}
        <div className="md:col-span-4 bg-white rounded-3xl p-3 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-1 self-start">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveSection(sec.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                  isActive
                    ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Form Content */}
        <div className="md:col-span-8 bg-white rounded-3xl p-6 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* 1. General Settings Panel */}
            {activeSection === "general" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-sm text-slate-900">General Settings</h2>
                  <p className="text-[11px] text-slate-400">Pool facility details and branding</p>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pool Name</label>
                    <input
                      type="text"
                      required
                      value={settings.poolName || "M.A.K Indoor Pool"}
                      onChange={(e) => setSettings({ ...settings, poolName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      value={settings.contactPhone || "+91 9847 123 456"}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Address</label>
                    <input
                      type="text"
                      required
                      value={settings.address || "Calicut, Kerala"}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-slate-900"
                    />
                  </div>

                  {/* Pool Logo Box */}
                  <div className="space-y-2 pt-2">
                    <label className="block font-bold text-slate-700">Pool Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-20 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center p-2 text-center shadow-xs">
                        <Waves className="w-6 h-6 text-sky-400" />
                        <span className="text-[10px] font-black leading-tight mt-1">M.A.K</span>
                        <span className="text-[8px] text-slate-300">Indoor Pool</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700"
                        >
                          Change Logo
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Pricing & Rates Panel */}
            {activeSection === "pricing" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-sm text-slate-900">Pricing & Rates</h2>
                  <p className="text-[11px] text-slate-400">Authoritative hourly tariffs and advance deposits</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Public Swimming Rate (₹ / hr / person)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={settings.defaultPublicRate}
                      onChange={(e) => setSettings({ ...settings, defaultPublicRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Family Base Rate (₹ / hr up to 12 persons)
                    </label>
                    <input
                      type="number"
                      min={100}
                      required
                      value={settings.defaultFamilyBaseRate}
                      onChange={(e) => setSettings({ ...settings, defaultFamilyBaseRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Family Extra Guest Rate (₹ / hr / person above 12)
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={settings.familyExtraRate}
                      onChange={(e) => setSettings({ ...settings, familyExtraRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Family Online Advance Required (₹)
                    </label>
                    <input
                      type="number"
                      min={100}
                      required
                      value={settings.familyAdvanceAmount}
                      onChange={(e) => setSettings({ ...settings, familyAdvanceAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Booking Rules Panel */}
            {activeSection === "rules" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-sm text-slate-900">Booking Rules & Capacity</h2>
                  <p className="text-[11px] text-slate-400">Enforce maximum swimmer limits and reservation holds</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Maximum Public Pool Capacity
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      required
                      value={settings.maxCapacity}
                      onChange={(e) => setSettings({ ...settings, maxCapacity: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Slot Hold Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      required
                      value={settings.holdTtlMinutes}
                      onChange={(e) => setSettings({ ...settings, holdTtlMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Cancellation Cutoff (Hours before slot)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={settings.cancellationCutoffHours}
                      onChange={(e) => setSettings({ ...settings, cancellationCutoffHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Reschedule Cutoff (Hours before slot)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={settings.rescheduleCutoffHours}
                      onChange={(e) => setSettings({ ...settings, rescheduleCutoffHours: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. Operational Hours Panel */}
            {activeSection === "hours" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-sm text-slate-900">Operational Hours</h2>
                  <p className="text-[11px] text-slate-400">Daily opening, closing, and session windows</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pool Opens (Hour AM)</label>
                    <input
                      type="number"
                      min={6}
                      max={12}
                      required
                      value={settings.openHour}
                      onChange={(e) => setSettings({ ...settings, openHour: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                    <span className="text-[10px] text-slate-400">Default: 9:00 AM</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Public Shift Ends (24h)</label>
                    <input
                      type="number"
                      min={12}
                      max={20}
                      required
                      value={settings.publicEndHour}
                      onChange={(e) => setSettings({ ...settings, publicEndHour: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                    <span className="text-[10px] text-slate-400">Default: 16 (4:00 PM)</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Pool Closes (24h)</label>
                    <input
                      type="number"
                      min={18}
                      max={24}
                      required
                      value={settings.closeHour}
                      onChange={(e) => setSettings({ ...settings, closeHour: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                    <span className="text-[10px] text-slate-400">Default: 23 (11:00 PM)</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Emergency Maintenance Mode Panel */}
            {activeSection === "maintenance" && (
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-sm text-slate-900">Maintenance Mode</h2>
                  <p className="text-[11px] text-slate-400">Emergency pool closure and customer notice banner</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={settings.maintenanceMode}
                      onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                      className="w-5 h-5 rounded-md text-[#1D68BD]"
                    />
                    <label htmlFor="maintenanceMode" className="font-bold text-slate-900">
                      Enable Emergency Maintenance Mode (Pauses all online checkout)
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Customer Facing Notice Message
                    </label>
                    <textarea
                      rows={3}
                      value={settings.maintenanceMessage || ""}
                      onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                      placeholder="e.g. Pool is temporarily closed today for routine water treatment."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Other informational sections */}
            {(activeSection === "notifications" ||
              activeSection === "receipts" ||
              activeSection === "retention" ||
              activeSection === "backup") && (
              <div className="space-y-3">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="font-extrabold text-sm text-slate-900 capitalize">
                    {activeSection} Configuration
                  </h2>
                  <p className="text-[11px] text-slate-400">Automated policy settings</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 border border-slate-100">
                  <span>
                    Settings active. Standard automated policy applied according to M.A.K Indoor Pool operational guidelines.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Blue Save Changes Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#1D68BD] hover:bg-[#155299] active:scale-[0.99] text-white font-extrabold px-6 py-3 rounded-2xl shadow-md shadow-blue-700/20 transition-all text-xs flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
