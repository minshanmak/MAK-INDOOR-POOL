"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Clock,
  IndianRupee,
  Calendar,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Maintenance mode local states
  const [maintenanceType, setMaintenanceType] = useState<"DISABLED" | "PARTIAL" | "FULL">("DISABLED");
  const [startDate, setStartDate] = useState("15 Mar 2025, 10:00 PM");
  const [endDate, setEndDate] = useState("16 Mar 2025, 06:00 AM");
  const [customerMessage, setCustomerMessage] = useState(
    "We will be performing scheduled maintenance on our booking system. Bookings may be temporarily unavailable. Please try again after 8:00 AM. Thank you for your understanding."
  );

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      setSettings(json.settings);
      if (json.settings?.maintenanceMode) {
        setMaintenanceType("FULL");
      }
      if (json.settings?.maintenanceNotice) {
        setCustomerMessage(json.settings.maintenanceNotice);
      }
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
      const payload = {
        ...settings,
        maintenanceMode: maintenanceType !== "DISABLED",
        maintenanceNotice: customerMessage,
      };

      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update settings.");
      }
      setFeedback({
        type: "success",
        msg: "System settings and maintenance mode updated successfully!",
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
          <div className="w-3.5 h-3.5 border-2 border-[#00838F] border-t-transparent rounded-full animate-spin" />
          <span>Loading system parameters...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Subtitle Matching Reference Image */}
      <div>
        <h1 className="text-xl font-black text-[#0A192F] tracking-tight">System Maintenance Mode</h1>
        <p className="text-xs text-slate-500">Control system availability for customers.</p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
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

      {/* Main System Maintenance Card Matching Reference Image */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6 max-w-3xl">
        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* Maintenance Mode Radio Options */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-[#0A192F]">
              Maintenance Mode
            </label>

            <div className="space-y-2.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="maintenanceMode"
                  value="DISABLED"
                  checked={maintenanceType === "DISABLED"}
                  onChange={() => setMaintenanceType("DISABLED")}
                  className="mt-0.5 text-[#00838F] focus:ring-[#00838F]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Disabled</span>
                  <span className="text-slate-500 text-[11px]">System is fully available for all users.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="maintenanceMode"
                  value="PARTIAL"
                  checked={maintenanceType === "PARTIAL"}
                  onChange={() => setMaintenanceType("PARTIAL")}
                  className="mt-0.5 text-[#00838F] focus:ring-[#00838F]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Partial Maintenance</span>
                  <span className="text-slate-500 text-[11px]">Only selected features are unavailable.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="maintenanceMode"
                  value="FULL"
                  checked={maintenanceType === "FULL"}
                  onChange={() => setMaintenanceType("FULL")}
                  className="mt-0.5 text-[#00838F] focus:ring-[#00838F]"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Full Maintenance</span>
                  <span className="text-slate-500 text-[11px]">System is unavailable to all customers.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Maintenance Period Pickers */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#0A192F]">
              Maintenance Period
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-[10px] text-slate-400 mb-0.5">Start Date &amp; Time</label>
                <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono text-slate-800 focus:outline-none"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-[10px] text-slate-400 mb-0.5">End Date &amp; Time</label>
                <div className="flex items-center border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono text-slate-800 focus:outline-none"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Customer Message Textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#0A192F]">
              Customer Message
            </label>
            <textarea
              rows={3}
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#00838F]"
            />
          </div>

          {/* Teal Save Changes Button Matching Reference */}
          <div>
            <button
              type="submit"
              disabled={saving}
              className="bg-[#00838F] hover:bg-[#007079] text-white font-bold px-6 py-2.5 rounded-lg text-xs shadow-xs transition duration-150"
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Pricing Rates & Operating Schedule Configuration */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4 max-w-3xl">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <IndianRupee className="w-4 h-4 text-[#00838F]" />
          <h2 className="font-bold text-[#0A192F] text-xs uppercase tracking-wider">
            Pool Pricing &amp; Capacity Rules
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">
              Public Swimming (₹ / person / hr)
            </label>
            <input
              type="number"
              min={50}
              required
              value={settings?.publicRatePerHour || 150}
              onChange={(e) =>
                setSettings({ ...settings, publicRatePerHour: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs text-slate-900 bg-slate-50"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">
              Family Base Rate (₹ / hr up to 12)
            </label>
            <input
              type="number"
              min={500}
              required
              value={settings?.familyBaseRatePerHour || 1500}
              onChange={(e) =>
                setSettings({ ...settings, familyBaseRatePerHour: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs text-slate-900 bg-slate-50"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">
              Extra Guest (₹ / person / hr)
            </label>
            <input
              type="number"
              min={0}
              required
              value={settings?.familyExtraPersonRate || 100}
              onChange={(e) =>
                setSettings({ ...settings, familyExtraPersonRate: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs text-slate-900 bg-slate-50"
            />
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs text-slate-900 bg-slate-50"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">
              Public Maximum Capacity
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
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs text-slate-900 bg-slate-50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
