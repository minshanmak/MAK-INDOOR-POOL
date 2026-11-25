"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getPoolDate, formatSlotTime } from "@/lib/timezone";
import StaffBookingModal from "@/components/admin/StaffBookingModal";
import EditBookingModal from "@/components/admin/EditBookingModal";
import CancelBookingModal from "@/components/admin/CancelBookingModal";
import {
  Calendar,
  Search,
  Filter,
  Plus,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  X,
  XCircle,
  Printer,
  ChevronRight,
  Clock,
  Users,
  MapPin,
  Camera,
  Edit3,
  MessageCircle,
  Send,
  Copy,
  Check,
  Waves,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

function AdminBookingsContent() {
  const searchParams = useSearchParams();
  const todayStr = useMemo(() => getPoolDate(), []);

  const queryParamSearch = searchParams.get("search") || searchParams.get("q") || "";
  const queryParamDate = searchParams.get("date");
  const queryParamType = searchParams.get("type");

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(queryParamSearch);
  const [filterType, setFilterType] = useState<"ALL" | "PUBLIC" | "FAMILY">(
    queryParamType === "PUBLIC" || queryParamType === "FAMILY" ? queryParamType : "ALL"
  );
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState(queryParamDate || todayStr);
  const [filterPendingBalanceOnly, setFilterPendingBalanceOnly] = useState(false);

  // Sync with URL search params changes
  useEffect(() => {
    const q = searchParams.get("search") || searchParams.get("q");
    const d = searchParams.get("date");
    const t = searchParams.get("type");
    if (q !== null && q !== undefined) setSearch(q);
    if (d) setSelectedDate(d);
    if (t === "PUBLIC" || t === "FAMILY" || t === "ALL") setFilterType(t as any);
  }, [searchParams]);

  // Create Staff Booking Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Collect Counter Balance Modal State
  const [collectingBooking, setCollectingBooking] = useState<any | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<"CASH" | "UPI">("CASH");
  const [collecting, setCollecting] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);

  // Edit Booking Modal & Toast State
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string>("STAFF");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch current user role for RBAC actions
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.role) setUserRole(data.user.role);
      })
      .catch(() => {});
  }, []);

  const isOwnerOrAdmin = userRole === "POOL_OWNER" || userRole === "SUPER_ADMIN";

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsAppPass = (b: any) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://makindoorpool.com";
    const passUrl = `${origin}/booking-status?ref=${b.id}&phone=${b.customerPhone}`;
    const text =
      `🏊‍♂️ *M.A.K INDOOR POOL - DIGITAL PASS*\n` +
      `Pass ID: *${b.id}*\n` +
      `Date: *${b.bookingDate}* (${formatSlotTime(b.startTime)} – ${formatSlotTime(b.endTime)})\n` +
      `Swimmers: *${b.guestCount} Guests*\n` +
      `Paid: ₹${b.totalPaid} | Balance: ₹${b.balanceAmount}\n\n` +
      `Show QR Pass at counter: \n${passUrl}\n\n` +
      `Help / Enquiry: +91 99477 14716`;
    const cleanPhone = b.customerPhone.replace(/\D/g, "").slice(-10);
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSendSms = async (b: any) => {
    try {
      const res = await fetch("/api/bookings/send-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: b.id, channel: "SMS" }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg(`SMS confirmation dispatched to ${b.customerPhone}`);
      } else {
        setToastMsg(`SMS: ${data.error || "Failed"}`);
      }
    } catch {
      setToastMsg("Failed to dispatch SMS.");
    } finally {
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/admin/bookings?type=${filterType}&status=${filterStatus}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (selectedDate) url += `&date=${selectedDate}`;
      const res = await fetch(url);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Error fetching bookings", err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, selectedDate, search]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleCollectBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingBooking) return;
    setCollecting(true);
    setCollectError(null);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COLLECT_BALANCE",
          bookingId: collectingBooking.id,
          paymentAmount: collectAmount,
          paymentMethod: collectMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to collect balance.");
      }
      setCollectingBooking(null);
      fetchBookings();
    } catch (err: any) {
      setCollectError(err.message || "Failed to collect balance.");
    } finally {
      setCollecting(false);
    }
  };

  const handleAdmitBooking = async (bookingId: string) => {
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHECK_IN_ONLINE",
          bookingId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMsg("Guest admitted and checked in successfully!");
        setTimeout(() => setToastMsg(null), 3000);
        fetchBookings();
      } else {
        alert(data.error || "Failed to admit booking.");
      }
    } catch (err: any) {
      console.error("Failed to admit booking", err);
      alert(err.message || "Failed to admit booking.");
    }
  };

  // Filter list by pending balance if toggle is on
  const displayedBookings = useMemo(() => {
    if (!filterPendingBalanceOnly) return bookings;
    return bookings.filter((b) => b.balanceAmount > 0 && b.status !== "CANCELLED");
  }, [bookings, filterPendingBalanceOnly]);

  // Fast Analysis Summary Metrics
  const metrics = useMemo(() => {
    let totalGuests = 0;
    let checkedInCount = 0;
    let pendingBalance = 0;
    let todayCount = 0;

    for (const b of bookings) {
      totalGuests += b.guestCount || 0;
      if (b.notes?.includes("Checked in at") || b.checkInStatus === "CHECKED_IN") {
        checkedInCount++;
      }
      if (b.balanceAmount > 0 && b.status !== "CANCELLED") {
        pendingBalance += b.balanceAmount;
      }
      if (b.bookingDate === todayStr) {
        todayCount++;
      }
    }

    return {
      totalCount: bookings.length,
      totalGuests,
      checkedInCount,
      pendingBalance,
      todayCount,
    };
  }, [bookings, todayStr]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. Fast Analysis KPI Summary Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Bookings */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(20,60,110,0.04)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1D68BD] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Bookings in View
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 tabular-nums">{metrics.totalCount}</span>
              <span className="text-[11px] text-slate-500 font-medium">({metrics.todayCount} today)</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Expected Swimmers */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(20,60,110,0.04)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Expected Guests
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 tabular-nums">{metrics.totalGuests}</span>
              <span className="text-[11px] text-slate-500 font-medium">swimmers</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Admitted / In Pool */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(20,60,110,0.04)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Admitted / In Pool
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-emerald-700 tabular-nums">{metrics.checkedInCount}</span>
              <span className="text-[11px] text-emerald-600 font-medium">checked in</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Pending Counter Balance */}
        <div
          onClick={() => setFilterPendingBalanceOnly(!filterPendingBalanceOnly)}
          className={`p-4 rounded-3xl border cursor-pointer transition-all ${filterPendingBalanceOnly
            ? "bg-amber-100/70 border-amber-300 ring-2 ring-amber-400"
            : "bg-white border-slate-100 shadow-[0_4px_20px_rgba(20,60,110,0.04)] hover:border-amber-200"
            } flex items-center gap-3`}
          title="Click to filter bookings with pending balance"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pending Counter Due
            </span>
            <div className="flex items-baseline justify-between mt-0.5">
              <span
                className={`text-xl font-bold tabular-nums ${metrics.pendingBalance > 0 ? "text-amber-700" : "text-slate-900"
                  }`}
              >
                ₹{metrics.pendingBalance.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                {filterPendingBalanceOnly ? "Filtered" : "Filter"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top Filter Tabs & New Booking Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => {
              setFilterType("ALL");
              setFilterPendingBalanceOnly(false);
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${filterType === "ALL" && !filterPendingBalanceOnly
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
              }`}
          >
            All Bookings
          </button>
          <button
            type="button"
            onClick={() => setFilterType("PUBLIC")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${filterType === "PUBLIC"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
              }`}
          >
            Public Swimming
          </button>
          <button
            type="button"
            onClick={() => setFilterType("FAMILY")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${filterType === "FAMILY"
              ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
              }`}
          >
            Family Booking
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedDate === todayStr) {
                setSelectedDate("");
              } else {
                setSelectedDate(todayStr);
              }
            }}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all inline-flex items-center gap-1.5 ${selectedDate === todayStr
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
              }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Today Only</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/scan"
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold px-3.5 py-2 rounded-2xl text-xs shadow-md shadow-emerald-700/20 transition flex items-center gap-1.5 shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Scan QR</span>
          </Link>

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-extrabold px-4 py-2 rounded-2xl text-xs shadow-md shadow-blue-700/20 transition flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* 3. Filter Bar (Date Picker, Status, Search) */}
      <div className="bg-white p-3.5 rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Date Picker with Quick Toggle */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
            {selectedDate ? (
              <button
                type="button"
                onClick={() => setSelectedDate("")}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition whitespace-nowrap"
                title="View bookings across all dates"
              >
                All Dates
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-[#1D68BD] bg-blue-50 hover:bg-blue-100 transition whitespace-nowrap"
                title="Filter to today's bookings"
              >
                Today
              </button>
            )}
          </div>

          {/* Status Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
          >
            <option value="ALL">All Status</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {(selectedDate !== todayStr || filterStatus !== "ALL" || search || filterPendingBalanceOnly) && (
            <button
              onClick={() => {
                setSelectedDate(todayStr);
                setFilterStatus("ALL");
                setSearch("");
                setFilterPendingBalanceOnly(false);
              }}
              className="text-[11px] text-rose-600 font-bold hover:underline px-1.5"
            >
              Reset to Today
            </button>
          )}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full md:max-w-md flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name or phone..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition-all font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-slate-400 hover:text-slate-600 p-0.5 absolute right-2.5 top-2.5 rounded"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-[#1D68BD] hover:bg-[#155299] text-white px-4 py-2 rounded-2xl font-bold active:scale-95 transition text-xs shadow-xs"
          >
            Search
          </button>
        </form>
      </div>

      {/* Active Filter Banner */}
      {search && (
        <div className="bg-purple-50/80 border border-purple-200/80 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-purple-900">Active Filter:</span>
            <span className="font-mono bg-white px-2.5 py-0.5 rounded-lg border border-purple-200 text-purple-950 font-bold text-xs">
              {search}
            </span>
            <span className="text-slate-500 text-[11px] hidden sm:inline">
              Showing matching reservation details
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSearch("")}
            className="text-xs font-bold text-[#1D68BD] hover:underline flex items-center gap-1"
          >
            <span>Clear Filter / Show All</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Bookings Ledger Table (Zero Unwanted Wrapping & High Contrast) */}
      <div className="bg-white rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading bookings ledger...</div>
        ) : displayedBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 min-w-[170px] whitespace-nowrap">Session Time</th>
                  <th className="px-4 py-3.5 min-w-[175px] whitespace-nowrap">Booking ID</th>
                  <th className="px-4 py-3.5 min-w-[130px] whitespace-nowrap">Type</th>
                  <th className="px-4 py-3.5 min-w-[100px] whitespace-nowrap">Guests</th>
                  <th className="px-4 py-3.5 min-w-[190px] whitespace-nowrap">Customer</th>
                  <th className="px-4 py-3.5 min-w-[125px] whitespace-nowrap">Payment</th>
                  <th className="px-4 py-3.5 min-w-[110px] whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 min-w-[210px] whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedBookings.map((b) => {
                  const isCheckedIn = b.notes?.includes("Checked in at") || b.checkInStatus === "CHECKED_IN";
                  const isToday = b.bookingDate === todayStr;
                  const isPast = b.bookingDate < todayStr;
                  const isFuture = b.bookingDate > todayStr;

                  return (
                    <tr key={b.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Session Time */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs tabular-nums">
                          {formatSlotTime(b.startTime)} – {formatSlotTime(b.endTime)}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-600 font-semibold tabular-nums">
                          <span>{b.bookingDate}</span>
                          {isToday ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Today
                            </span>
                          ) : isPast ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              Past Date
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Booking ID (Zero Wrapping + 1-Click Copy) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#1D68BD] font-mono tracking-tight text-xs tabular-nums whitespace-nowrap">
                            {b.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyId(b.id)}
                            className="p-1 text-slate-400 hover:text-slate-800 transition rounded"
                            title="Copy Booking ID"
                          >
                            {copiedId === b.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Type Badge (Single Line Pill) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight whitespace-nowrap ${b.type === "FAMILY"
                            ? "bg-purple-100 text-purple-800 border border-purple-200/60"
                            : "bg-sky-100 text-sky-800 border border-sky-200/60"
                            }`}
                        >
                          {b.type === "FAMILY" ? "Family Session" : "Public Swimming"}
                        </span>
                      </td>

                      {/* Guests */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900 text-xs tabular-nums">
                        {b.guestCount} {b.guestCount === 1 ? "Swimmer" : "Swimmers"}
                      </td>

                      {/* Customer Info (High Contrast Phone & Name) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-xs">{b.customerName}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-slate-700 font-semibold text-[11px] tabular-nums">
                            {b.customerPhone}
                          </span>
                          {b.customerPlace && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{b.customerPlace}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment (Clear Balance Warning) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900 tabular-nums text-xs">₹{b.totalAmount}</div>
                        <div className="mt-0.5">
                          {b.balanceAmount > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 tabular-nums whitespace-nowrap">
                              Due: ₹{b.balanceAmount}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              Fully Paid
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status (Single Line Badge) */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight whitespace-nowrap ${isCheckedIn
                              ? "bg-sky-100 text-sky-800 border border-sky-200/80"
                              : b.status === "CONFIRMED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200/80"
                                : b.status === "CANCELLED"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200/80"
                                  : "bg-amber-100 text-amber-800 border border-amber-200/80"
                              }`}
                          >
                            {isCheckedIn ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-sky-600" />
                                <span>Checked In</span>
                              </>
                            ) : b.status === "CONFIRMED" ? (
                              <>
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                <span>Confirmed</span>
                              </>
                            ) : (
                              b.status
                            )}
                          </span>

                          {/* Pending Cancel Request Notice */}
                          {b.status === "CONFIRMED" && b.cancellationReason && (
                            <span
                              title={b.cancellationReason}
                              className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs flex items-center gap-1"
                            >
                              <AlertCircle className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                              <span>Cancel Pending</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions (Segmented Toolbar, Zero Wrapping) */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Utility Icons Group (WhatsApp, SMS, Edit, Cancel) */}
                          <div className="inline-flex items-center bg-slate-50 border border-slate-200/80 rounded-xl p-0.5 gap-0.5">
                            {/* 1-Click WhatsApp Pass */}
                            <button
                              type="button"
                              onClick={() => handleWhatsAppPass(b)}
                              title="Send Pass on WhatsApp"
                              className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 transition active:scale-95"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>

                            {/* 1-Click SMS Pass */}
                            <button
                              type="button"
                              onClick={() => handleSendSms(b)}
                              title="Send SMS Pass"
                              className="p-1 rounded-lg text-[#1D68BD] hover:bg-blue-100 transition active:scale-95"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Booking (Staff Only) */}
                            {b.status !== "CANCELLED" && (
                              <button
                                type="button"
                                onClick={() => setEditingBooking(b)}
                                title="Edit Booking details"
                                className="p-1 rounded-lg text-slate-700 hover:bg-slate-200 transition active:scale-95"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Cancel / Request Cancel Booking */}
                            {b.status !== "CANCELLED" && b.status !== "COMPLETED" && !isCheckedIn && (
                              <button
                                type="button"
                                onClick={() => setCancellingBooking(b)}
                                title={isOwnerOrAdmin ? "Cancel Booking & Release Slot" : "Request Cancellation from Owner"}
                                className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 transition active:scale-95"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Primary Operational Action */}
                          {isCheckedIn ? (
                            <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                              ✓ Admitted
                            </span>
                          ) : b.balanceAmount > 0 && b.status === "CONFIRMED" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCollectingBooking(b);
                                setCollectAmount(b.balanceAmount);
                                setCollectError(null);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold px-2.5 py-1 rounded-xl text-[11px] shadow-xs transition whitespace-nowrap"
                            >
                              Collect ₹{b.balanceAmount}
                            </button>
                          ) : b.status === "CONFIRMED" ? (
                            isPast ? (
                              <button
                                type="button"
                                onClick={() => setEditingBooking(b)}
                                title="Booking was for a past date. Please edit/reschedule date to today before admitting."
                                className="bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-900 border border-amber-300 font-bold px-2.5 py-1 rounded-xl text-[11px] shadow-2xs transition whitespace-nowrap flex items-center gap-1"
                              >
                                <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Reschedule Date</span>
                              </button>
                            ) : isFuture ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`This booking is scheduled for future date ${b.bookingDate}. Are you sure you want to admit today?`)) {
                                    handleAdmitBooking(b.id);
                                  }
                                }}
                                className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-300 font-bold px-2.5 py-1 rounded-xl text-[11px] shadow-2xs transition whitespace-nowrap"
                              >
                                Admit Early
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAdmitBooking(b.id)}
                                className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-bold px-3 py-1 rounded-xl shadow-xs active:scale-95 transition whitespace-nowrap"
                              >
                                Admit Guest
                              </button>
                            )
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No bookings found matching current filters.
          </div>
        )}
      </div>

      {/* Collect Balance Modal */}
      {collectingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Collect Counter Balance</h3>
              <button
                onClick={() => setCollectingBooking(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {collectError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{collectError}</span>
              </div>
            )}

            <form onSubmit={handleCollectBalance} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between font-semibold">
                  <span>Pass ID:</span>
                  <span className="font-mono text-[#1D68BD] font-bold">{collectingBooking.id}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Customer:</span>
                  <span className="text-slate-900">{collectingBooking.customerName}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm pt-1 border-t border-slate-200/60">
                  <span>Pending Balance:</span>
                  <span className="text-amber-600">₹{collectingBooking.balanceAmount}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="CASH">Cash at Counter</option>
                  <option value="UPI">UPI QR Scanner</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount to Collect (₹)</label>
                <input
                  type="number"
                  min={1}
                  max={collectingBooking.balanceAmount}
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCollectingBooking(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={collecting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {collecting ? "Recording..." : `Confirm ₹${collectAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Smart Staff Booking Modal */}
      <StaffBookingModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchBookings();
        }}
      />

      {/* Admin Edit Booking Modal */}
      <EditBookingModal
        booking={editingBooking}
        isOpen={!!editingBooking}
        onClose={() => setEditingBooking(null)}
        onSuccess={() => {
          setEditingBooking(null);
          fetchBookings();
          setToastMsg("Booking updated & customer notified!");
          setTimeout(() => setToastMsg(null), 3500);
        }}
      />

      {/* Admin Cancel Booking Modal */}
      <CancelBookingModal
        booking={cancellingBooking}
        isOpen={!!cancellingBooking}
        userRole={userRole}
        onClose={() => setCancellingBooking(null)}
        onSuccess={(data) => {
          setCancellingBooking(null);
          fetchBookings();
          setToastMsg(
            isOwnerOrAdmin
              ? "Booking cancelled & slot released!"
              : "Cancellation request submitted for owner approval."
          );
          setTimeout(() => setToastMsg(null), 4000);
        }}
      />

      {/* Operational Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 text-xs">
          Loading bookings ledger...
        </div>
      }
    >
      <AdminBookingsContent />
    </Suspense>
  );
}
