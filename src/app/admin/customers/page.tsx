"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Phone, Calendar, User, MoreHorizontal, X } from "lucide-react";
import { formatPoolDate } from "@/lib/timezone";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/admin/customers?search=${encodeURIComponent(search)}`
        : "/api/admin/customers";
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const getInitials = (fullName: string) => {
    const parts = (fullName || "Guest").trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0][0] || "G").toUpperCase();
  };

  const avatarGradients = [
    "bg-slate-800 text-white",
    "bg-emerald-700 text-white",
    "bg-teal-600 text-white",
    "bg-rose-700 text-white",
    "bg-amber-700 text-white",
    "bg-indigo-700 text-white",
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Top Search & Add Customer Action Bar (Exact Mockup Match) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 w-full max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-[#1D68BD]/20 transition-all font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
        </form>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs shadow-md shadow-blue-700/20 transition flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Customers Table (Exact Mockup Match) */}
      <div className="bg-white rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading customer directory...</div>
        ) : customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Total Bookings</th>
                  <th className="px-5 py-3.5">Last Booking</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c, idx) => {
                  const color = avatarGradients[idx % avatarGradients.length];
                  return (
                    <tr key={c.phone + idx} className="hover:bg-slate-50/70 transition-colors">
                      {/* Customer with Initials Avatar */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${color}`}
                          >
                            {getInitials(c.name)}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block text-xs">
                              {c.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Total Spent: ₹{c.totalSpent?.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5 font-mono text-slate-600 font-medium">
                        {c.phone}
                      </td>

                      {/* Total Bookings */}
                      <td className="px-5 py-3.5 font-black text-slate-900 tabular-nums">
                        {c.totalBookings}
                      </td>

                      {/* Last Booking */}
                      <td className="px-5 py-3.5 text-slate-500 font-medium">
                        {c.lastBooking ? formatPoolDate(c.lastBooking) : "N/A"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">No customer profiles found.</div>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Add Customer Profile</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowAddModal(false);
                fetchCustomers();
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 9847..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1D68BD] text-white font-bold"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

