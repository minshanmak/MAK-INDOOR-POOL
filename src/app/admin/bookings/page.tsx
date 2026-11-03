"use client";

import React, { useState, useEffect } from "react";
import { getPoolDate, formatSlotTime } from "@/lib/timezone";
import {
  Calendar,
  Search,
  Filter,
  Plus,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  ChevronRight,
  Clock,
  Users,
} from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PUBLIC" | "FAMILY">("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");

  // Create Staff Booking Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBookingType, setNewBookingType] = useState<"PUBLIC" | "FAMILY">("FAMILY");
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    setNewDate(getPoolDate());
  }, []);

  const [newStartTime, setNewStartTime] = useState("17:00");
  const [newDuration, setNewDuration] = useState(2);
  const [newGuestCount, setNewGuestCount] = useState(10);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerPlace, setNewCustomerPlace] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState<"CASH" | "UPI">("CASH");
  const [newAdvancePaid, setNewAdvancePaid] = useState(750);
  const [modalError, setModalError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Collect Counter Balance Modal State
  const [collectingBooking, setCollectingBooking] = useState<any | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMethod, setCollectMethod] = useState<"CASH" | "UPI">("CASH");
  const [collecting, setCollecting] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);

  const fetchBookings = async () => {
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
  };

  useEffect(() => {
    fetchBookings();
  }, [filterType, filterStatus, selectedDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const getEndTime = (start: string, duration: number) => {
    const [h, m] = start.split(":").map(Number);
    const totalMinutes = h * 60 + (m || 0) + duration * 60;
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setModalError(null);
    try {
      const endTime = getEndTime(newStartTime, newDuration);
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingType: newBookingType,
          date: newDate,
          startTime: newStartTime,
          endTime,
          guestCount: newGuestCount,
          customerName: newCustomerName,
          customerPhone: newCustomerPhone,
          customerPlace: newCustomerPlace.trim() || undefined,
          isStaffCreated: true,
          paymentMethod: newPaymentMethod,
          initialAmount: newAdvancePaid,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create staff booking.");
      }
      setShowCreateModal(false);
      fetchBookings();
    } catch (err: any) {
      setModalError(err.message || "Failed to create booking.");
    } finally {
      setCreating(false);
    }
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
      if (res.ok) {
        fetchBookings();
      }
    } catch (err) {
      console.error("Failed to admit booking", err);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Filter Tabs & New Booking Action (Exact Mockup Match) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              filterType === "ALL"
                ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
                : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
            }`}
          >
            All Bookings
          </button>
          <button
            type="button"
            onClick={() => setFilterType("PUBLIC")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              filterType === "PUBLIC"
                ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
                : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
            }`}
          >
            Public Swimming
          </button>
          <button
            type="button"
            onClick={() => setFilterType("FAMILY")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              filterType === "FAMILY"
                ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
                : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
            }`}
          >
            Family Booking
          </button>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setShowCreateModal(true);
          }}
          className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-extrabold px-4 py-2 rounded-2xl text-xs shadow-md shadow-blue-700/20 transition flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Booking</span>
        </button>
      </div>

      {/* Filter Bar (Date Picker, Status, Search) */}
      <div className="bg-white p-3.5 rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
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

          {(selectedDate || filterStatus !== "ALL" || search) && (
            <button
              onClick={() => {
                setSelectedDate("");
                setFilterStatus("ALL");
                setSearch("");
              }}
              className="text-[11px] text-rose-600 font-bold hover:underline px-1.5"
            >
              Reset
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
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#1D68BD]/20 transition-all font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button
            type="submit"
            className="bg-[#1D68BD] hover:bg-[#155299] text-white px-4 py-2 rounded-2xl font-bold active:scale-95 transition text-xs shadow-xs"
          >
            Search
          </button>
        </form>
      </div>

      {/* Bookings Table (Exact Mockup Match) */}
      <div className="bg-white rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading bookings ledger...</div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Session Time</th>
                  <th className="px-5 py-3.5">Booking ID</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Guests</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Payment</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const isCheckedIn = b.notes?.includes("Checked in at");
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Session Time */}
                      <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {formatSlotTime(b.startTime)} – {formatSlotTime(b.endTime)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono font-medium">
                          {b.bookingDate}
                        </div>
                      </td>

                      {/* Booking ID */}
                      <td className="px-5 py-3.5 font-mono font-extrabold text-[#1D68BD]">
                        {b.id}
                      </td>

                      {/* Type Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                            b.type === "FAMILY"
                              ? "bg-purple-50 text-purple-700 border border-purple-200/80"
                              : "bg-blue-50 text-[#1D68BD] border border-blue-200/80"
                          }`}
                        >
                          {b.type === "FAMILY" ? "Family (Exclusive)" : "Public Swimming"}
                        </span>
                      </td>

                      {/* Guests */}
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {b.guestCount} {b.guestCount === 1 ? "Guest" : "Guests"}
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{b.customerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                          <span>{b.customerPhone}</span>
                          {b.customerPlace && (
                            <span className="text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded font-sans font-semibold">
                              📍 {b.customerPlace}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 tabular-nums">₹{b.totalAmount}</div>
                        {b.balanceAmount > 0 ? (
                          <div className="text-[10px] text-amber-600 font-semibold tabular-nums">
                            Bal: ₹{b.balanceAmount}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-600 font-semibold">Fully Paid</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                            isCheckedIn
                              ? "bg-sky-50 text-sky-700 border border-sky-200/80"
                              : b.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : b.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200/80"
                              : "bg-amber-50 text-amber-700 border border-amber-200/80"
                          }`}
                        >
                          {isCheckedIn ? "Checked In" : b.status === "CONFIRMED" ? "Confirmed" : b.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {isCheckedIn ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Admitted
                            </span>
                          ) : b.status === "CONFIRMED" ? (
                            <button
                              onClick={() => handleAdmitBooking(b.id)}
                              className="bg-[#1D68BD] hover:bg-[#155299] text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-xs active:scale-95 transition"
                            >
                              Admit Guest
                            </button>
                          ) : null}

                          {b.balanceAmount > 0 && b.status === "CONFIRMED" ? (
                            <button
                              onClick={() => {
                                setCollectingBooking(b);
                                setCollectAmount(b.balanceAmount);
                                setCollectError(null);
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold px-3 py-1 rounded-xl shadow-xs active:scale-95 transition"
                            >
                              Collect ₹{b.balanceAmount}
                            </button>
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
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {collectError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-1.5 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{collectError}</span>
              </div>
            )}

            <form onSubmit={handleCollectBalance} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl space-y-1 text-slate-600 border border-slate-100">
                <div className="flex justify-between font-semibold">
                  <span>Booking ID:</span>
                  <span className="font-mono text-[#1D68BD]">{collectingBooking.id}</span>
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

      {/* Create Staff Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Create Staff Booking</h3>
                <p className="text-[11px] text-slate-400">Direct booking with slot lock</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-1.5 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Booking Type</label>
                  <select
                    value={newBookingType}
                    onChange={(e) => setNewBookingType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="FAMILY">Family (Exclusive)</option>
                    <option value="PUBLIC">Public Swimming</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    required
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Guest Count</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={newGuestCount}
                    onChange={(e) => setNewGuestCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Phone</label>
                  <input
                    type="tel"
                    required
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Place / Town</label>
                  <input
                    type="text"
                    value={newCustomerPlace}
                    onChange={(e) => setNewCustomerPlace(e.target.value)}
                    placeholder="e.g. Moonniyur, Chelari"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Advance (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newAdvancePaid}
                    onChange={(e) => setNewAdvancePaid(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-2xl bg-[#1D68BD] hover:bg-[#155299] text-white font-bold shadow-md shadow-blue-700/20"
                >
                  {creating ? "Creating..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
