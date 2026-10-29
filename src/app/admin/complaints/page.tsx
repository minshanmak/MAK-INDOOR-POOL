"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquareWarning,
  Plus,
  CheckCircle2,
  Star,
  ShieldCheck,
  AlertCircle,
  X,
  Clock,
} from "lucide-react";

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Complaint Form State
  const [showCreate, setShowCreate] = useState(false);
  const [category, setCategory] = useState("WATER_QUALITY");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Resolve Modal State
  const [resolvingComplaint, setResolvingComplaint] = useState<any | null>(null);
  const [resolutionText, setResolutionText] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/complaints");
      const json = await res.json();
      setComplaints(json.complaints || []);
      setFeedbacks(json.feedbacks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_COMPLAINT",
          category,
          description,
          customerName,
          customerPhone,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setDescription("");
        setCustomerName("");
        setCustomerPhone("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESOLVE_COMPLAINT",
          complaintId: resolvingComplaint.id,
          resolution: resolutionText,
          status: "RESOLVED",
        }),
      });
      if (res.ok) {
        setResolvingComplaint(null);
        setResolutionText("");
        fetchData();
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
          <span>Loading customer feedback & complaints...</span>
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
            <MessageSquareWarning className="w-3.5 h-3.5" />
            <span>CUSTOMER EXPERIENCE AUDIT & TICKETING</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Complaints & Feedback</h1>
          <p className="text-xs text-slate-500">
            Log counter issues, track corrective actions, and review verified customer ratings
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs shadow-xs transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Customer Complaint</span>
        </button>
      </div>

      {/* Module 1: Active Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Complaint Tickets Ledger ({complaints.length})</span>
          </h2>
        </div>

        {complaints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Resolution Notes</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{c.id}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900">{c.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{c.customerName || "Anonymous"}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{c.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs">{c.description}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {c.resolution || "Pending corrective action"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status !== "RESOLVED" ? (
                        <button
                          onClick={() => {
                            setResolvingComplaint(c);
                            setResolutionText("");
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] px-2.5 py-1 rounded transition"
                        >
                          Resolve Ticket
                        </button>
                      ) : (
                        <span className="text-emerald-700 text-[11px] font-semibold">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No complaints logged. Excellent service record!
          </div>
        )}
      </div>

      {/* Module 2: Feedback & Ratings */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Customer Feedback Ledger ({feedbacks.length})</span>
          </h2>
        </div>

        {feedbacks.length > 0 ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feedbacks.map((f: any) => (
              <div key={f.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/40 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">{f.customerName || "Customer"}</span>
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: f.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{f.comments}</p>
                <span className="text-[10px] text-slate-400 font-mono block">
                  {new Date(f.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No customer ratings or reviews logged yet.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Log New Complaint Ticket</h3>
                <p className="text-xs text-slate-500">Record customer issue or facility complaint</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  <option value="WATER_QUALITY">Water Quality / Temperature</option>
                  <option value="FACILITY_CLEANLINESS">Shower / Changing Room Cleanliness</option>
                  <option value="STAFF_BEHAVIOR">Staff Conduct</option>
                  <option value="BOOKING_ISSUE">Booking / Rescheduling Dispute</option>
                  <option value="OTHER">Other Operational Matter</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Visitor name"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Phone Number</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="9847012345"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Issue Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the complaint in detail..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
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
                  {submitting ? "Logging..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Resolve Complaint Ticket</h3>
                <p className="text-xs text-slate-500 font-mono">Ticket ID: {resolvingComplaint.id}</p>
              </div>
              <button onClick={() => setResolvingComplaint(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResolveComplaint} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 space-y-1">
                <div className="font-bold text-slate-900">{resolvingComplaint.category}</div>
                <p className="text-[11px] text-slate-600">{resolvingComplaint.description}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                  Corrective Action / Resolution Taken *
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="e.g. Backwashed filters, retested chlorine at 2.2 ppm, spoke with customer..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Mark Ticket Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
