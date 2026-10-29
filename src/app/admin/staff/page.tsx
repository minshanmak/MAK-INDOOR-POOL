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
  Lock,
} from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          action: "TOGGLE_STATUS",
          userId,
          status: nextStatus,
        }),
      });
      if (res.ok) {
        fetchStaff();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs font-mono">
        <div className="inline-flex items-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading staff accounts & permissions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/90 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-800 font-semibold mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>ROLE-BASED ACCESS CONTROL (RBAC)</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Staff & Permissions</h1>
          <p className="text-xs text-slate-500">
            Individual user accounts for duty employees, custom permission matrices, and account deactivation
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-xs transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Staff Account</span>
        </button>
      </div>

      {/* Staff Accounts Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Users2 className="w-4 h-4 text-cyan-700" />
            <span>Registered Operational Accounts ({staff.length})</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">User Name</th>
                <th className="px-4 py-3">Phone & Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Permission Scope</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    <div>{u.phone}</div>
                    <div className="text-[10px] text-slate-400">{u.email || "No email"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        u.role === "POOL_OWNER"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : u.role === "SUPER_ADMIN"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] text-slate-600 font-medium">
                      {u.role === "POOL_OWNER"
                        ? "Full Operational Scope + Refund Approvals"
                        : u.role === "SUPER_ADMIN"
                        ? "Platform Administrator"
                        : "Operational Duty (Refunds Strictly Blocked)"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role !== "SUPER_ADMIN" && u.role !== "POOL_OWNER" && (
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded transition ${
                          u.status === "ACTIVE"
                            ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Staff Account Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Create Individual Staff Account</h3>
                <p className="text-xs text-slate-500">Every employee must have their own login credentials</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>}

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anandhu K"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919847012345"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="anandhu@makpool.com"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="STAFF">Duty Staff (Operational)</option>
                    <option value="POOL_OWNER">Pool Owner (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px] leading-relaxed">
                <strong>Policy Reminder:</strong> Duty staff accounts have access to bookings, walk-ins, daily checklists, and water readings. By system policy, only Pool Owners can approve or disburse customer refunds.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold"
                >
                  {submitting ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
