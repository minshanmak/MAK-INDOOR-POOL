"use client";

import React, { useState, useEffect } from "react";
import {
  Users2,
  Plus,
  ShieldCheck,
  UserX,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  X,
  MoreHorizontal,
} from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs: "MEMBERS" | "ROLES"
  const [activeTab, setActiveTab] = useState<"MEMBERS" | "ROLES">("MEMBERS");

  // New Staff Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Password@123");
  const [role, setRole] = useState("STAFF");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([
    PERMISSIONS.BOOKINGS_VIEW,
    PERMISSIONS.BOOKINGS_CREATE,
    PERMISSIONS.BOOKINGS_EDIT,
    PERMISSIONS.BOOKINGS_CANCEL_REQUEST,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_CREATE,
    PERMISSIONS.WALKIN_MANAGE,
    PERMISSIONS.MAINTENANCE_VIEW,
    PERMISSIONS.MAINTENANCE_LOG,
    PERMISSIONS.CLOSING_SUBMIT,
    PERMISSIONS.COMPLAINTS_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/staff");
      const json = await res.json();
      setStaff(json.staff || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE",
          name,
          phone,
          email,
          password,
          role,
          permissions: selectedPerms,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create staff account.");
      }
      setShowCreate(false);
      setName("");
      setPhone("");
      setEmail("");
      fetchStaff();
    } catch (err: any) {
      setError(err.message || "Failed to create staff account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATUS",
          userId,
          status: nextStatus,
        }),
      });
      if (res.ok) fetchStaff();
    } catch (err) {
      console.error(err);
    }
  };

  const getInitials = (fullName: string) => {
    const parts = (fullName || "Staff").trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0][0] || "S").toUpperCase();
  };

  const avatarColors = [
    "bg-purple-600 text-white",
    "bg-teal-600 text-white",
    "bg-indigo-600 text-white",
    "bg-blue-600 text-white",
    "bg-amber-600 text-white",
    "bg-emerald-600 text-white",
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Tabs: Staff Members, Roles & Permissions & Add Staff Button (Exact Mockup Match) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("MEMBERS")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "MEMBERS"
                ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
                : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
            }`}
          >
            Staff Members
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ROLES")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "ROLES"
                ? "bg-[#1D68BD] text-white shadow-md shadow-blue-600/20"
                : "bg-white text-slate-600 hover:text-slate-900 border border-white shadow-[0_2px_10px_rgba(20,60,110,0.04)]"
            }`}
          >
            Roles & Permissions
          </button>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowCreate(true);
          }}
          className="bg-[#1D68BD] hover:bg-[#155299] active:scale-95 text-white font-extrabold px-4 py-2 rounded-2xl text-xs shadow-md shadow-blue-700/20 transition flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* Staff Table Card (Exact Mockup Match) */}
      <div className="bg-white rounded-3xl border border-white shadow-[0_4px_20px_rgba(20,60,110,0.05)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading staff ledger...</div>
        ) : staff.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Staff</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((s, idx) => {
                  const avatarColor = avatarColors[idx % avatarColors.length];
                  const displayRole =
                    s.role === "POOL_OWNER"
                      ? "Owner / Manager"
                      : s.role === "SUPER_ADMIN"
                      ? "Administrator"
                      : "Front Desk";
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Avatar Initials + Name */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${avatarColor}`}
                          >
                            {getInitials(s.name)}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block text-xs">
                              {s.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {s.email || "No email assigned"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5 font-bold text-slate-700">{displayRole}</td>

                      {/* Phone */}
                      <td className="px-5 py-3.5 font-mono text-slate-600 font-medium">
                        {s.phone}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                            s.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-rose-50 text-rose-700 border border-rose-200/80"
                          }`}
                        >
                          {s.status === "ACTIVE" ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {s.role !== "SUPER_ADMIN" ? (
                          <button
                            onClick={() => handleToggleStatus(s.id, s.status)}
                            className={`text-[11px] font-bold px-3 py-1 rounded-xl transition ${
                              s.status === "ACTIVE"
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-mono">Primary</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">No staff accounts found.</div>
        )}
      </div>

      {/* Create Staff Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Add New Staff Member</h3>
                <p className="text-[11px] text-slate-400">Create staff login credentials</p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-1.5 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shabeer Ali"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9847..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@makpool.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Staff Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="STAFF">Front Desk / Staff</option>
                    <option value="POOL_OWNER">Manager / Owner</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#1D68BD] text-white font-bold"
                >
                  {submitting ? "Creating..." : "Save Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
