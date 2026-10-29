"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquareWarning,
  Plus,
  CheckCircle2,
  Star,
  ShieldCheck,
  AlertCircle,
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

  const handleToggleFeedbackApproval = async (feedbackId: string, currentApproval: boolean) => {
    try {
      const res = await fetch("/api/admin/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_FEEDBACK",
          feedbackId,
          isApproved: !currentApproval,
        }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading feedback & complaints...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Complaints & Feedback</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log and resolve customer issues, audit service quality, and moderate public website reviews
          </p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-ocean-600 hover:bg-ocean-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Log New Complaint
        </button>
      </div>

      {/* New Complaint Form */}
      {showCreate && (
        <form onSubmit={handleCreateComplaint} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-slate-900 text-sm">Log New Customer Complaint Ticket</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              >
                <option value="WATER_QUALITY">Water Quality / Temperature</option>
                <option value="FACILITY">Facility & Cleanliness</option>
                <option value="STAFF">Staff Behavior</option>
                <option value="BILLING">Billing / Refund Issue</option>
                <option value="OTHER">Other Operational Issue</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Phone *</label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description of Issue *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed customer remark or incident..."
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
            />
          </div>
          <div className="flex justify-end gap-2">
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
              {submitting ? "Logging..." : "Create Ticket"}
            </button>
          </div>
        </form>
      )}

      {/* Complaints List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-sm">Complaint Tickets ({complaints.length})</h2>
        </div>

        {complaints.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-mono font-bold text-ocean-700">{c.ticketNumber}</td>
                    <td className="px-4 py-3 font-semibold">{c.category}</td>
                    <td className="px-4 py-3">
                      <div>{c.customerName}</div>
                      <div className="text-[10px] text-slate-400">{c.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-600">
                      {c.description}
                      {c.resolution && (
                        <div className="text-emerald-700 font-semibold text-[11px] mt-0.5">
                          Resolution: {c.resolution}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === "RESOLVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status !== "RESOLVED" && (
                        <button
                          onClick={() => setResolvingComplaint(c)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[11px]"
                        >
                          Resolve Ticket
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">No active complaints logged.</div>
        )}
      </div>

      {/* Resolve Modal */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleResolveComplaint} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Resolve Complaint: {resolvingComplaint.ticketNumber}</h3>
            <p className="text-slate-600">{resolvingComplaint.description}</p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resolution Actions Taken *</label>
              <textarea
                required
                rows={3}
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="e.g. Cleaned changing room immediately / chemical dosing corrected / customer contacted"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolvingComplaint(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
              >
                Mark Ticket Resolved
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
