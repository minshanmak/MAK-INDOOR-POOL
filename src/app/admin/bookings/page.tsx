"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Plus,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Clock,
  RotateCcw,
} from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED">("ALL");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Create Staff Booking Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBookingType, setNewBookingType] = useState<"PUBLIC" | "FAMILY">("FAMILY");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newStartTime, setNewStartTime] = useState("16:00");
  const [newDuration, setNewDuration] = useState(1);
  const [newGuestCount, setNewGuestCount] = useState(8);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
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

  // View Receipt Modal State
  const [receiptBooking, setReceiptBooking] = useState<any | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let statusQuery = filterStatus;
      if (activeTab === "UPCOMING") statusQuery = "CONFIRMED";
      if (activeTab === "COMPLETED") statusQuery = "COMPLETED";
      if (activeTab === "CANCELLED") statusQuery = "CANCELLED";

      let url = `/api/admin/bookings?type=${filterType}&status=${statusQuery}`;
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
  }, [filterType, filterStatus, activeTab, selectedDate]);

  const handleTabClick = (tab: "ALL" | "UPCOMING" | "COMPLETED" | "CANCELLED") => {
    setActiveTab(tab);
    if (tab === "ALL") setFilterStatus("ALL");
    else if (tab === "UPCOMING") setFilterStatus("CONFIRMED");
    else if (tab === "COMPLETED") setFilterStatus("COMPLETED");
    else if (tab === "CANCELLED") setFilterStatus("CANCELLED");
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
          bookingDate: newDate,
          startTime: newStartTime,
          endTime,
          guestCount: newGuestCount,
          customerName: newCustomerName,
          customerPhone: newCustomerPhone,
          isStaffCreated: true,
          paymentMethod: newPaymentMethod,
          initialAmount: newAdvancePaid,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create booking.");
      }
      setShowCreateModal(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      fetchBookings();
    } catch (err: any) {
      setModalError(err.message || "Failed to create booking.");
    } finally {
      setCreating(false);
    }
  };

  const handleCollectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingBooking) return;
    setCollecting(true);
    setCollectError(null);
    try {
      const res = await fetch("/api/admin/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COLLECT_BALANCE",
          bookingId: collectingBooking.id,
          amount: collectAmount,
          method: collectMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to collect balance.");
      }
      setCollectingBooking(null);
      fetchBookings();
    } catch (err: any) {
      setCollectError(err.message || "Payment collection error.");
    } finally {
      setCollecting(false);
    }
  };

  const formatShortDate = (dStr: string) => {
    if (!dStr) return "";
    const dateObj = new Date(dStr);
    return dateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Matching Reference Image */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-[#0A192F] tracking-tight">Bookings</h1>
          <p className="text-xs text-slate-500">Manage all swimming pool bookings</p>
        </div>

        {/* Teal Action Button Matching Reference */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#00838F] hover:bg-[#007079] text-white font-bold px-4 py-2 rounded-lg text-xs shadow-xs transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ New Booking</span>
        </button>
      </div>

      {/* Status Filter Tabs Matching Reference Image */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          type="button"
          onClick={() => handleTabClick("ALL")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === "ALL"
              ? "bg-[#00838F] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("UPCOMING")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === "UPCOMING"
              ? "bg-[#00838F] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
          }`}
        >
          Upcoming
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("COMPLETED")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === "COMPLETED"
              ? "bg-[#00838F] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
          }`}
        >
          Completed
        </button>
        <button
          type="button"
          onClick={() => handleTabClick("CANCELLED")}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === "CANCELLED"
              ? "bg-[#00838F] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200"
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* Filter Bar Matching Reference Image */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-center">
          {/* Date Range Selector */}
          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 bg-slate-50"
            />
          </div>

          {/* Booking Type Dropdown */}
          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Booking Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 bg-slate-50"
            >
              <option value="ALL">All Types</option>
              <option value="FAMILY">Family (Exclusive)</option>
              <option value="PUBLIC">Public Swimming</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 bg-slate-50"
            >
              <option value="ALL">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="sm:col-span-3">
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchBookings()}
                className="w-full pl-7 pr-2.5 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 bg-slate-50"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Table Matching Reference Image */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-mono">
            Loading bookings table...
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Date &amp; Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900 font-mono">
                        {formatShortDate(b.bookingDate)}, {b.startTime}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{b.customerName || "Customer"}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{b.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-700">
                        {b.type === "FAMILY" ? "Family" : "Public"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{b.guestCount}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 font-mono">₹{b.totalAmount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          b.status === "CONFIRMED"
                            ? b.balanceAmount > 0
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : b.status === "COMPLETED"
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : b.status === "CANCELLED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {b.status === "CONFIRMED" && b.balanceAmount > 0
                          ? "Pending Payment"
                          : b.status === "CONFIRMED"
                          ? "Confirmed"
                          : b.status === "COMPLETED"
                          ? "Checked-in"
                          : b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.balanceAmount > 0 && b.status === "CONFIRMED" && (
                          <button
                            onClick={() => {
                              setCollectingBooking(b);
                              setCollectAmount(b.balanceAmount);
                              setCollectError(null);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs transition"
                          >
                            Collect ₹{b.balanceAmount}
                          </button>
                        )}
                        <button
                          onClick={() => setReceiptBooking(b)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No bookings found matching current filters.
          </div>
        )}

        {/* Pagination Matching Reference Image */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition"
          >
            &lt; Previous
          </button>

          <div className="flex items-center gap-1 font-mono text-xs">
            <span className="w-6 h-6 rounded bg-[#00838F] text-white flex items-center justify-center font-bold">
              1
            </span>
            <span className="w-6 h-6 rounded text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
              2
            </span>
            <span className="w-6 h-6 rounded text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
              3
            </span>
          </div>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
          >
            Next &gt;
          </button>
        </div>
      </div>

      {/* Create Staff Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Create Pool Booking (Staff Counter)</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded bg-red-50 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Session Type</label>
                  <select
                    value={newBookingType}
                    onChange={(e) => setNewBookingType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
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
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
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
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Guests</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newGuestCount}
                    onChange={(e) => setNewGuestCount(Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Menon"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="98470XXXXX"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Advance Collected (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newAdvancePaid}
                    onChange={(e) => setNewAdvancePaid(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="CASH">Counter Cash</option>
                    <option value="UPI">Counter UPI</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 rounded-lg bg-[#00838F] hover:bg-[#007079] text-white text-xs font-bold transition shadow-xs"
                >
                  {creating ? "Creating..." : "Confirm & Book Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Balance Modal */}
      {collectingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Collect Remaining Counter Balance</h3>
                <p className="text-xs text-slate-500 font-mono">Booking: {collectingBooking.id}</p>
              </div>
              <button onClick={() => setCollectingBooking(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {collectError && (
              <div className="p-3 bg-red-50 text-red-700 rounded text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{collectError}</span>
              </div>
            )}

            <form onSubmit={handleCollectSubmit} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <span className="font-bold text-slate-900">{collectingBooking.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount:</span>
                  <span className="font-mono text-slate-900">₹{collectingBooking.totalAmount}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Already Paid:</span>
                  <span className="font-mono text-emerald-700">₹{collectingBooking.totalPaid}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-bold pt-1 border-t border-slate-200">
                  <span>Outstanding Balance:</span>
                  <span className="font-mono text-rose-700">₹{collectingBooking.balanceAmount}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount to Collect (₹) *</label>
                <input
                  type="number"
                  min={1}
                  max={collectingBooking.balanceAmount}
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method *</label>
                <select
                  value={collectMethod}
                  onChange={(e) => setCollectMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="CASH">Cash Drawer</option>
                  <option value="UPI">Counter UPI QR</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCollectingBooking(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={collecting}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-xs"
                >
                  {collecting ? "Recording..." : `Confirm Payment • ₹${collectAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View / Print Receipt Modal */}
      {receiptBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">M.A.K Indoor Pool Receipt</h3>
                <p className="text-xs text-slate-500 font-mono">Ref: {receiptBooking.id}</p>
              </div>
              <button onClick={() => setReceiptBooking(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{receiptBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Session:</span>
                <span className="font-mono text-slate-900">{receiptBooking.bookingDate} ({receiptBooking.startTime} – {receiptBooking.endTime})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Charged:</span>
                <span className="font-bold font-mono text-slate-900">₹{receiptBooking.totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid:</span>
                <span className="font-bold font-mono text-emerald-700">₹{receiptBooking.totalPaid}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Remaining Balance:</span>
                <span className="font-bold font-mono text-slate-900">₹{receiptBooking.balanceAmount}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
