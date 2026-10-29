"use client";

import React, { useState, useEffect } from "react";
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
  RotateCcw,
} from "lucide-react";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState("");

  // Create Staff Booking Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBookingType, setNewBookingType] = useState<"PUBLIC" | "FAMILY">("FAMILY");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newStartTime, setNewStartTime] = useState("17:00");
  const [newDuration, setNewDuration] = useState(2);
  const [newGuestCount, setNewGuestCount] = useState(10);
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

  return (
    <div className="space-y-6">
      {/* Title & Primary Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-800 font-semibold mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>OPERATIONAL CALENDAR & RESERVATION LEDGER</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Booking Operations</h1>
          <p className="text-xs text-slate-500">
            Manage reservation schedules, log phone/WhatsApp bookings, and collect counter balances
          </p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setShowCreateModal(true);
          }}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-xs transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Staff Booking</span>
        </button>
      </div>

      {/* High-density Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Booking ID, customer name or phone..."
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-cyan-500 text-slate-900 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-medium"
          >
            <option value="ALL">All Sessions</option>
            <option value="FAMILY">Family (Exclusive)</option>
            <option value="PUBLIC">Public Swimming</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-medium"
          >
            <option value="ALL">All Status</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {(selectedDate || filterType !== "ALL" || filterStatus !== "ALL" || search) && (
            <button
              onClick={() => {
                setSelectedDate("");
                setFilterType("ALL");
                setFilterStatus("ALL");
                setSearch("");
              }}
              className="text-[11px] text-rose-600 font-bold hover:underline px-1 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-mono">
            Loading bookings ledger...
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Session Date & Time</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-800">{b.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 tabular-nums">{b.bookingDate}</div>
                      <div className="text-[11px] text-slate-500 tabular-nums">
                        {b.startTime} – {b.endTime}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.type === "FAMILY"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-sky-50 text-sky-700 border border-sky-200"
                        }`}
                      >
                        {b.type === "FAMILY" ? "Family (Private)" : "Public"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{b.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{b.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">{b.guestCount} Persons</td>
                    <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">₹{b.totalAmount}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-700 tabular-nums">₹{b.totalPaid}</td>
                    <td className="px-4 py-3 font-bold text-amber-700 tabular-nums">₹{b.balanceAmount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : b.status === "CANCELLED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.balanceAmount > 0 && b.status === "CONFIRMED" ? (
                          <button
                            onClick={() => {
                              setCollectingBooking(b);
                              setCollectAmount(b.balanceAmount);
                              setCollectError(null);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-xs transition"
                          >
                            Collect ₹{b.balanceAmount}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] font-medium mr-1">Paid</span>
                        )}
                        <button
                          onClick={() => setReceiptBooking(b)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="View Receipt"
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
            No bookings found matching the current search parameters.
          </div>
        )}
      </div>

      {/* Collect Balance Modal */}
      {collectingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Collect Counter Balance</h3>
                <p className="text-xs text-slate-500 font-mono">Booking Ref: {collectingBooking.id}</p>
              </div>
              <button
                onClick={() => setCollectingBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {collectError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{collectError}</div>
            )}

            <form onSubmit={handleCollectBalance} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <strong className="text-slate-900">{collectingBooking.customerName}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Amount:</span>
                  <span className="font-semibold text-slate-900">₹{collectingBooking.totalAmount}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Already Paid:</span>
                  <span className="text-emerald-700 font-semibold">₹{collectingBooking.totalPaid}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1.5 mt-1 text-sm">
                  <span>Remaining Balance:</span>
                  <span className="text-amber-700">₹{collectingBooking.balanceAmount}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Collection Amount (₹) *
                </label>
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
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCollectMethod("CASH")}
                    className={`p-2 rounded-lg border text-center font-bold text-xs transition ${
                      collectMethod === "CASH"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-700 bg-white"
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectMethod("UPI")}
                    className={`p-2 rounded-lg border text-center font-bold text-xs transition ${
                      collectMethod === "UPI"
                        ? "border-cyan-600 bg-cyan-50 text-cyan-900 ring-1 ring-cyan-600"
                        : "border-slate-200 text-slate-700 bg-white"
                    }`}
                  >
                    UPI QR Code
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCollectingBooking(null)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={collecting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {collecting ? "Recording..." : `Confirm ₹${collectAmount} Collected`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Manual Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">New Staff-Created Booking</h3>
                <p className="text-xs text-slate-500">Record phone, WhatsApp or walk-in reservation</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{modalError}</div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Session Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewBookingType("FAMILY");
                      setNewStartTime("17:00");
                      setNewAdvancePaid(750);
                    }}
                    className={`p-2 rounded-lg border text-center font-bold text-xs transition ${
                      newBookingType === "FAMILY"
                        ? "border-cyan-600 bg-cyan-50 text-cyan-900 ring-1 ring-cyan-600"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    Family (4 PM – 11 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewBookingType("PUBLIC");
                      setNewStartTime("10:00");
                      setNewAdvancePaid(300);
                    }}
                    className={`p-2 rounded-lg border text-center font-bold text-xs transition ${
                      newBookingType === "PUBLIC"
                        ? "border-cyan-600 bg-cyan-50 text-cyan-900 ring-1 ring-cyan-600"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    Public (9 AM – 4 PM)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Duration</label>
                  <select
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-900"
                  >
                    <option value={1}>1 Hr</option>
                    <option value={2}>2 Hrs</option>
                    <option value={3}>3 Hrs</option>
                    <option value={4}>4 Hrs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Total Guests</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newGuestCount}
                  onChange={(e) => setNewGuestCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    placeholder="e.g. Sreejith V"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="9847012345"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Initial Payment Collected (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={newAdvancePaid}
                    onChange={(e) => setNewAdvancePaid(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Payment Method</label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-900"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  {creating ? "Confirming..." : "Confirm Staff Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Customer Booking Receipt</h3>
                <p className="text-xs text-slate-500 font-mono">Ref: {receiptBooking.id}</p>
              </div>
              <button
                onClick={() => setReceiptBooking(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 space-y-2 tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <strong className="text-slate-900">{receiptBooking.customerName}</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Contact:</span>
                  <span className="font-mono text-slate-900">{receiptBooking.customerPhone}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Date & Slot:</span>
                  <span className="font-bold text-slate-900">
                    {receiptBooking.bookingDate} ({receiptBooking.startTime} – {receiptBooking.endTime})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Session:</span>
                  <span className="font-semibold text-slate-900">{receiptBooking.type}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Guests:</span>
                  <span className="text-slate-900">{receiptBooking.guestCount} Persons</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                  <span>Total Amount:</span>
                  <span>₹{receiptBooking.totalAmount}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Amount Paid:</span>
                  <span>₹{receiptBooking.totalPaid}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>Balance Due:</span>
                  <span>₹{receiptBooking.balanceAmount}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
