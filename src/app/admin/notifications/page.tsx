"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Clock,
  Droplets,
  Coins,
  CalendarCheck,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  MessageSquareWarning,
  SlidersHorizontal,
  Check,
  ExternalLink,
} from "lucide-react";

interface NotificationItem {
  id: string;
  category: "OPERATIONS" | "SAFETY" | "BOOKING" | "FINANCE" | "COMPLAINT";
  priority: "URGENT" | "IMPORTANT" | "INFO";
  title: string;
  message: string;
  time: string;
  actionUrl: string;
  actionLabel: string;
  createdAt: string;
}

const READ_STORAGE_KEY = "mak_admin_read_notifications_v1";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "URGENT" | "SAFETY" | "OPERATIONS" | "FINANCE" | "COMPLAINT">("ALL");
  const [readIds, setReadIds] = useState<string[]>([]);

  // Load read notification IDs from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(READ_STORAGE_KEY);
        if (stored) setReadIds(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) throw new Error("Could not load notifications.");
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error("Notifications fetch error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), 25000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = (id: string) => {
    const updated = Array.from(new Set([...readIds, id]));
    setReadIds(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    }
  };

  const clearAllRead = () => {
    setReadIds([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(READ_STORAGE_KEY);
      } catch {}
    }
  };

  const unreadNotifications = notifications.filter((n) => !readIds.includes(n.id));

  const filteredList = notifications.filter((n) => {
    if (activeFilter === "ALL") return true;
    if (activeFilter === "URGENT") return n.priority === "URGENT";
    return n.category === activeFilter;
  });

  const urgentCount = unreadNotifications.filter((n) => n.priority === "URGENT").length;
  const operationsCount = unreadNotifications.filter((n) => n.category === "OPERATIONS" || n.category === "SAFETY").length;
  const financeCount = unreadNotifications.filter((n) => n.category === "FINANCE").length;

  if (loading) {
    return (
      <div className="min-h-[460px] flex flex-col items-center justify-center gap-3 bg-white rounded-3xl p-8 border border-white shadow-xs">
        <div className="w-8 h-8 border-3 border-[#1D68BD] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-600">Loading operations notifications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12 font-sans">
      {/* 1. Top Operations Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-3xl p-4 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)]">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
            <Bell className="w-4 h-4 text-[#1D68BD] stroke-[1.75]" />
            <span>Active Alerts</span>
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
            {unreadNotifications.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Requires attention</span>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)]">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
            <AlertCircle className="w-4 h-4 text-rose-600 stroke-[1.75]" />
            <span>Urgent</span>
          </div>
          <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">
            {urgentCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Immediate action</span>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)]">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
            <Droplets className="w-4 h-4 text-sky-600 stroke-[1.75]" />
            <span>Operations &amp; Safety</span>
          </div>
          <span className="text-2xl font-black text-sky-700 font-mono mt-1 block">
            {operationsCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Pool &amp; session status</span>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)]">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
            <Coins className="w-4 h-4 text-emerald-600 stroke-[1.75]" />
            <span>Financial &amp; Balances</span>
          </div>
          <span className="text-2xl font-black text-emerald-700 font-mono mt-1 block">
            {financeCount}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Pending collections</span>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-white shadow-[0_4px_20px_rgba(20,60,110,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {[
            { id: "ALL", label: "All Alerts", count: notifications.length },
            { id: "URGENT", label: "Urgent", count: urgentCount },
            { id: "SAFETY", label: "Water & Safety" },
            { id: "OPERATIONS", label: "Operations" },
            { id: "FINANCE", label: "Finances & Balances" },
            { id: "COMPLAINT", label: "Complaints" },
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-2xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#1D68BD] text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/70 text-slate-700"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? "bg-white/25 text-white" : "bg-slate-200 text-slate-800"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {unreadNotifications.length > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[1.75]" />
              <span>Mark all read</span>
            </button>
          )}

          {readIds.length > 0 && (
            <button
              type="button"
              onClick={clearAllRead}
              className="px-3 py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              Reset read
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchNotifications()}
            disabled={refreshing}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#1D68BD]" : ""}`} />
          </button>
        </div>
      </div>

      {/* 3. Notifications List */}
      <div className="space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-white shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">All Operations Clear</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                No active operational alerts or pending items found for this category. All pool tests, bookings, and balances are up to date.
              </p>
            </div>
          </div>
        ) : (
          filteredList.map((item) => {
            const isRead = readIds.includes(item.id);
            const isUrgent = item.priority === "URGENT";
            const isImportant = item.priority === "IMPORTANT";

            // Category Icon & Accent
            let IconComponent = Bell;
            let iconBg = "bg-slate-100 text-slate-700";
            if (item.category === "SAFETY") {
              IconComponent = Droplets;
              iconBg = isUrgent ? "bg-red-50 text-red-600" : "bg-sky-50 text-sky-700";
            } else if (item.category === "OPERATIONS") {
              IconComponent = Clock;
              iconBg = isUrgent ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-700";
            } else if (item.category === "FINANCE") {
              IconComponent = Coins;
              iconBg = "bg-emerald-50 text-emerald-700";
            } else if (item.category === "COMPLAINT") {
              IconComponent = MessageSquareWarning;
              iconBg = "bg-amber-50 text-amber-700";
            }

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isRead
                    ? "bg-white/60 border-slate-200/60 opacity-60"
                    : isUrgent
                    ? "bg-rose-50/70 border-rose-200 shadow-xs shadow-rose-200/30"
                    : isImportant
                    ? "bg-amber-50/50 border-amber-200"
                    : "bg-white border-white shadow-xs"
                }`}
              >
                {/* Left Content */}
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
                    <IconComponent className="w-5 h-5 stroke-[1.75]" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          isUrgent
                            ? "bg-rose-600 text-white"
                            : isImportant
                            ? "bg-amber-600 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {item.priority}
                      </span>

                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 stroke-[1.75]" />
                        <span>{item.time}</span>
                      </span>

                      {isRead && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Read
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl">
                      {item.message}
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!isRead && (
                    <button
                      type="button"
                      onClick={() => markAsRead(item.id)}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold transition"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[1.75]" />
                    </button>
                  )}

                  <Link
                    href={item.actionUrl}
                    className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 shadow-xs ${
                      isUrgent
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-[#1D68BD] hover:bg-[#155299] text-white"
                    }`}
                  >
                    <span>{item.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[1.75]" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

