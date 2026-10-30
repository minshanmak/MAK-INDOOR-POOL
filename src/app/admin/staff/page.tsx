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

  const togglePermission = (code: string) => {
    if (selectedPerms.includes(code)) {
      setSelectedPerms(selectedPerms.filter((p) => p !== code));
    } else {
      setSelectedPerms([...selectedPerms, code]);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading staff accounts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff & Permissions</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Owner control panel to manage staff member accounts, permissions, and immediate revocation
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowCreate(true);
          }}
          className="bg-ocean-600 hover:bg-ocean-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add Staff Account
        </button>
      </div>

      {/* Staff List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Staff Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Granted Permissions</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-bold text-slate-900">{s.name}</td>
                  <td className="px-4 py-3">
                    <div>{s.phone}</div>
                    <div className="text-[10px] text-slate-400">{s.email || "No email"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-ocean-50 text-ocean-800">
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      s.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-500 max-w-xs truncate">
                    {s.role === "POOL_OWNER" || s.role === "SUPER_ADMIN"
                      ? "Full Administrative Access"
                      : `${s.permissions?.length || 0} permissions granted`}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.role !== "SUPER_ADMIN" && (
                      <button
                        onClick={() => handleToggleStatus(s.id, s.status)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded transition ${
                          s.status === "ACTIVE"
                            ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Staff Account Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateStaff} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-base">Create Individual Staff Account</h3>
            <p className="text-slate-500 text-xs">
              Every staff member or family member working at the pool must have an individual account for audit traceability.
            </p>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sreejith V"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919847012345"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="optional"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Temporary Password *</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            {/* Granular Permissions Matrix */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-800 mb-2">Granted Operational Permissions</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                {Object.entries(PERMISSIONS)
                  .filter(([_, code]) => code !== PERMISSIONS.REFUNDS_DECIDE && code !== PERMISSIONS.SETTINGS_MANAGE)
                  .map(([name, code]) => (
                    <label key={code} className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(code)}
                        onChange={() => togglePermission(code)}
                        className="rounded text-ocean-600 focus:ring-ocean-500"
                      />
                      <span className="text-slate-700 font-medium">{code}</span>
                    </label>
                  ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Note: Refund decisions and Settings modification are strictly reserved for the Pool Owner.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
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
                className="px-4 py-1.5 rounded-lg bg-ocean-600 text-white font-bold"
              >
                {submitting ? "Creating..." : "Save Account"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

