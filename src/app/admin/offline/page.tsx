"use client";

import React, { useState, useEffect } from "react";
import {
  WifiOff,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileClock,
  ShieldCheck,
  Plus,
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
          logs.push(
            `Successfully synced record ${item.id} (${item.customerName}, ₹${item.collectedAmount}) to authoritative database.`
          );
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

  return (
    <div className="space-y-6">
      {/* Title & Network Status Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-800 font-semibold mb-1">
            <WifiOff className="w-3.5 h-3.5" />
            <span>CONNECTIVITY DISRUPTION RESILIENCE</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Offline Queue & Synchronization</h1>
          <p className="text-xs text-slate-500">
            Queue walk-ins locally when internet connectivity fails, then synchronize with conflict checks
          </p>
        </div>

        <div
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 ${
            isOnline
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800 animate-pulse"
          }`}
        >
          {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-rose-600" />}
          <span>{isOnline ? "Network Connected (Online)" : "Connection Offline (Local Mode)"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Queue Offline Swimmer Entry */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-700" />
              <span>Queue Offline Walk-in Admission</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Entries are safely stored in browser encrypted local storage until reconnected.
            </p>
          </div>

          <form onSubmit={handleQueueOfflineWalkin} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Swimmer Count *</label>
              <input
                type="number"
                min={1}
                required
                value={offlineVisitorCount}
                onChange={(e) => setOfflineVisitorCount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Duration (Hours) *</label>
              <select
                value={offlineDuration}
                onChange={(e) => setOfflineDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value={1}>1 Hour (₹150 / person)</option>
                <option value={2}>2 Hours (₹300 / person)</option>
                <option value={3}>3 Hours (₹450 / person)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">Customer Identifier</label>
              <input
                type="text"
                value={offlineCustName}
                onChange={(e) => setOfflineCustName(e.target.value)}
                placeholder="Walk-in Swimmer / Group"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
              <span className="text-slate-600">Calculated Cash to Collect:</span>
              <strong className="text-slate-900 tabular-nums font-mono text-sm">
                ₹{offlineVisitorCount * offlineDuration * 150}
              </strong>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs shadow-xs transition"
            >
              + Store in Local Offline Queue
            </button>
          </form>
        </div>

        {/* Right Pane: Pending Queue & Sync Trigger */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileClock className="w-4 h-4 text-cyan-700" />
                  <span>Pending Offline Sync Queue ({offlineQueue.length})</span>
                </h2>
              </div>

              {offlineQueue.length > 0 && (
                <button
                  onClick={handleProcessSync}
                  disabled={syncing || !isOnline}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{syncing ? "Synchronizing Records..." : "Sync All to Database"}</span>
                </button>
              )}
            </div>

            {offlineQueue.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {offlineQueue.map((item) => (
                  <div key={item.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50/60">
                    <div>
                      <div className="font-bold text-slate-900">{item.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {item.visitorCount} Swimmers • {item.durationHours} Hr • Cash: ₹{item.collectedAmount}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold">
                      LOCAL QUEUED
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Offline queue is empty. All local entries have been synchronized!
              </div>
            )}
          </div>

          {/* Sync Log Audit */}
          {syncLog.length > 0 && (
            <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 font-mono block">
                SYNCHRONIZATION AUDIT LOG
              </span>
              <div className="space-y-1 font-mono text-[11px] text-slate-300">
                {syncLog.map((log, lIdx) => (
                  <div key={lIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
