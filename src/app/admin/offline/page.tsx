"use client";

import React, { useState, useEffect } from "react";
import { formatPoolTime } from "@/lib/timezone";
import {
  WifiOff,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileClock,
  ShieldCheck,
} from "lucide-react";

export default function AdminOfflineSyncPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);

  // Simulated Quick Walk-in form while offline
  const [offlineVisitorCount, setOfflineVisitorCount] = useState(2);
  const [offlineDuration, setOfflineDuration] = useState(1);
  const [offlineCustName, setOfflineCustName] = useState("");

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Load offline queue from localStorage
    const saved = localStorage.getItem("mak_offline_queue");
    if (saved) {
      try {
        setOfflineQueue(JSON.parse(saved));
      } catch {
        setOfflineQueue([]);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const saveQueue = (newQueue: any[]) => {
    setOfflineQueue(newQueue);
    localStorage.setItem("mak_offline_queue", JSON.stringify(newQueue));
  };

  const handleQueueOfflineWalkin = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = {
      id: `LOCAL-${Date.now()}`,
      action: "QUICK_ENTRY",
      visitorCount: offlineVisitorCount,
      durationHours: offlineDuration,
      ratePerHour: 150,
      calculatedCharge: offlineVisitorCount * offlineDuration * 150,
      collectedAmount: offlineVisitorCount * offlineDuration * 150,
      paymentMethod: "CASH",
      customerName: offlineCustName || "Walk-in Swimmer",
      queuedAt: new Date().toISOString(),
      isLocalDraft: true,
    };

    saveQueue([...offlineQueue, entry]);
    setOfflineCustName("");
  };

  const handleProcessSync = async () => {
    if (offlineQueue.length === 0) return;
    setSyncing(true);
    const logs: string[] = [];

    for (const item of offlineQueue) {
      try {
        const res = await fetch("/api/admin/walkins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (res.ok) {
          logs.push(`Successfully synced record ${item.id} (${item.customerName}, ₹${item.collectedAmount}) to authoritative database.`);
        } else {
          logs.push(`Failed to sync record ${item.id}: Conflict detected or server rejected.`);
        }
      } catch (err: any) {
        logs.push(`Sync error for ${item.id}: ${err.message}`);
      }
    }

    setSyncLog(logs);
    saveQueue([]); // Clear processed queue
    setSyncing(false);
  };

  const toggleSimulateOffline = () => {
    setIsOnline(!isOnline);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Offline Support & Queue Sync</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational continuity during internet outages. Local queueing for walk-ins and conflict detection.
          </p>
        </div>

        <button
          onClick={toggleSimulateOffline}
          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
            isOnline
              ? "bg-emerald-50 border-emerald-300 text-emerald-800"
              : "bg-amber-100 border-amber-300 text-amber-900"
          }`}
        >
          {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-amber-600" />}
          <span>{isOnline ? "Network: Online (Click to toggle)" : "Network: Offline (Simulated)"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offline Queue Form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileClock className="w-4 h-4 text-amber-600" />
              Queue Operational Entry (Local Only)
            </h2>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
              Local Storage
            </span>
          </div>

          <p className="text-slate-600">
            Records saved here are marked as <strong>Locally Saved and Not Server-Confirmed</strong>. They will be held in safe browser storage until you synchronize.
          </p>

          <form onSubmit={handleQueueOfflineWalkin} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Swimmer Count</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={offlineVisitorCount}
                  onChange={(e) => setOfflineVisitorCount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duration (Hours)</label>
                <select
                  value={offlineDuration}
                  onChange={(e) => setOfflineDuration(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer / Group Name</label>
              <input
                type="text"
                value={offlineCustName}
                onChange={(e) => setOfflineCustName(e.target.value)}
                placeholder="Walk-in Swimmer"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-xl"
            >
              Queue Entry (Local Storage)
            </button>
          </form>
        </div>

        {/* Pending Sync Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 text-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-ocean-600" />
                Pending Synchronization Queue ({offlineQueue.length})
              </h2>
            </div>

            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
              {offlineQueue.length > 0 ? (
                offlineQueue.map((item) => (
                  <div key={item.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{item.customerName} ({item.visitorCount} Swimmers)</span>
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded">
                        NOT SERVER CONFIRMED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Amount: ₹{item.collectedAmount} ({item.paymentMethod})</span>
                      <span>Queued: {formatPoolTime(item.queuedAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400">Queue is empty. All records synchronized.</div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleProcessSync}
              disabled={offlineQueue.length === 0 || syncing}
              className="w-full bg-ocean-600 hover:bg-ocean-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Synchronizing to Database..." : `Synchronize ${offlineQueue.length} Record(s)`}
            </button>
          </div>
        </div>
      </div>

      {syncLog.length > 0 && (
        <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs font-mono space-y-1">
          <span className="font-bold text-lagoon-400 block mb-1">Synchronization Audit Log:</span>
          {syncLog.map((log, i) => (
            <div key={i}>&gt; {log}</div>
          ))}
        </div>
      )}
    </div>
  );
}

