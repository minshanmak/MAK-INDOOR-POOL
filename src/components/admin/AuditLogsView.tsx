"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  Clock,
  User,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Eye,
  Sliders,
  X,
  CreditCard,
  Settings,
  Users2,
  FileCheck2,
  Footprints,
} from "lucide-react";

interface AuditLogsViewProps {
  initialEntityType?: string;
  showHeader?: boolean;
}

export default function AuditLogsView({
  initialEntityType = "ALL",
  showHeader = true,
}: AuditLogsViewProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState(initialEntityType);
  const [action, setAction] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  });
  const [entitySummary, setEntitySummary] = useState<Record<string, number>>({});

  // UI state
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (entityType && entityType !== "ALL") params.set("entityType", entityType);
      if (action && action !== "ALL") params.set("action", action);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", page.toString());
      params.set("limit", "50");

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load audit logs.");
      }
      setLogs(data.logs || []);
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, totalPages: 1 });
      setEntitySummary(data.entitySummary || {});
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [search, entityType, action, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetFilters = () => {
    setSearch("");
    setEntityType("ALL");
    setAction("ALL");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const exportCsv = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "Entity", "Entity ID", "Action", "Actor Name", "Actor Role", "Details", "IP Address"];
    const rows = logs.map((l) => [
      new Date(l.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      l.entityType,
      l.entityId,
      l.action,
      l.performedByUser?.name || "System / Guest",
      l.userRole || "N/A",
      `"${(l.details || "").replace(/"/g, '""')}"`,
      l.ipAddress || "N/A",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mak-pool-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimestamp = (isoDate: string) => {
    try {
      const d = new Date(isoDate);
      return d.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return isoDate;
    }
  };

  const getActionBadge = (act: string) => {
    switch (act) {
      case "CREATE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "UPDATE":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "DELETE":
      case "REJECT":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "APPROVE":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "OVERRIDE":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "BOOKING":
        return <Calendar className="w-3.5 h-3.5 text-blue-600" />;
      case "PAYMENT":
      case "REFUND":
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      case "SETTING":
        return <Settings className="w-3.5 h-3.5 text-purple-600" />;
      case "USER":
        return <Users2 className="w-3.5 h-3.5 text-indigo-600" />;
      case "CLOSING":
        return <FileCheck2 className="w-3.5 h-3.5 text-teal-600" />;
      case "WALKIN":
        return <Footprints className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const ENTITY_TABS = [
    { id: "ALL", label: "All Records", count: pagination.total },
    { id: "BOOKING", label: "Bookings", count: entitySummary.BOOKING || 0 },
    { id: "PAYMENT", label: "Payments", count: (entitySummary.PAYMENT || 0) + (entitySummary.REFUND || 0) },
    { id: "WALKIN", label: "Walk-ins", count: entitySummary.WALKIN || 0 },
    { id: "SETTING", label: "Settings", count: entitySummary.SETTING || 0 },
    { id: "USER", label: "Staff & Users", count: entitySummary.USER || 0 },
    { id: "CLOSING", label: "Daily Closing", count: entitySummary.CLOSING || 0 },
  ];

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(20,60,110,0.03)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1D68BD] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>System Audit Trail</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Immutable Log
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Tamper-evident record of all staff edits, financial transactions, overrides, and cancellations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition active:scale-95 disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#1D68BD] hover:bg-[#155299] text-white shadow-2xs transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}

      {/* Entity Type Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {ENTITY_TABS.map((tab) => {
          const isActive = entityType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setEntityType(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#1D68BD] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Detail Filters Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(20,60,110,0.03)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by details, actor name, booking ID, or IP..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1D68BD] focus:outline-none focus:ring-1 focus:ring-[#1D68BD] transition"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div className="sm:col-span-3">
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1D68BD] focus:outline-none focus:ring-1 focus:ring-[#1D68BD] font-medium text-slate-700"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="OVERRIDE">OVERRIDE</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="sm:col-span-3 flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              title="From Date"
              className="w-1/2 py-2 px-2 rounded-xl text-[11px] bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1D68BD] focus:outline-none text-slate-700 tabular-nums"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              title="To Date"
              className="w-1/2 py-2 px-2 rounded-xl text-[11px] bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#1D68BD] focus:outline-none text-slate-700 tabular-nums"
            />
          </div>
        </div>

        {(search || action !== "ALL" || dateFrom || dateTo) && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-500 text-[11px]">
              Filtered by: {search && `"${search}" `} {action !== "ALL" && `[${action}] `} {dateFrom && `from ${dateFrom} `} {dateTo && `to ${dateTo}`}
            </span>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#1D68BD] hover:underline font-semibold text-[11px]"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Audit Logs Table / Feed */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(20,60,110,0.03)] overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-[#1D68BD] border-t-transparent rounded-full animate-spin" />
            <span>Loading audit log records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-1">
            <p className="font-semibold text-slate-600">No audit logs found matching your filters.</p>
            <p className="text-[11px] text-slate-400">Try clearing filters or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3 min-w-[150px] whitespace-nowrap">Timestamp</th>
                  <th className="px-4 py-3 min-w-[120px] whitespace-nowrap">Entity</th>
                  <th className="px-4 py-3 min-w-[100px] whitespace-nowrap">Action</th>
                  <th className="px-4 py-3 min-w-[160px] whitespace-nowrap">Actor</th>
                  <th className="px-4 py-3 min-w-[280px]">Details &amp; Reason</th>
                  <th className="px-4 py-3 min-w-[80px] text-right whitespace-nowrap">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-blue-50/20 transition-colors">
                      {/* Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 tabular-nums">
                        <div className="font-semibold text-slate-800 text-xs">
                          {formatTimestamp(log.createdAt)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.ipAddress ? `IP: ${log.ipAddress}` : "Internal / System"}
                        </div>
                      </td>

                      {/* Entity */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getEntityIcon(log.entityType)}
                          <span className="font-bold text-slate-800 text-[11px]">{log.entityType}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-500 truncate max-w-[110px]" title={log.entityId}>
                            {log.entityId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(log.entityId, log.id)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                            title="Copy Entity ID"
                          >
                            {copiedId === log.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 text-xs truncate max-w-[140px]">
                          {log.performedByUser?.name || "Customer / Public"}
                        </div>
                        <div className="mt-0.5">
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {log.userRole || log.performedByUser?.role || "GUEST"}
                          </span>
                        </div>
                      </td>

                      {/* Details & Reason */}
                      <td className="px-4 py-3">
                        <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed">
                          {log.details}
                        </p>
                      </td>

                      {/* Inspect */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#1D68BD] hover:bg-blue-50 transition active:scale-95"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold tabular-nums">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
              <span className="font-semibold tabular-nums">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-semibold tabular-nums">{pagination.total}</span> records
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-xs font-semibold tabular-nums">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1D68BD]" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">Audit Record Inspection</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timestamp</span>
                  <span className="font-semibold text-slate-800 tabular-nums">{formatTimestamp(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Action</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${getActionBadge(selectedLog.action)}`}>
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entity</span>
                  <span className="font-bold text-slate-800">{selectedLog.entityType}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entity ID</span>
                  <span className="font-mono text-[11px] text-slate-700 block truncate" title={selectedLog.entityId}>
                    {selectedLog.entityId}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Actor Information</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{selectedLog.performedByUser?.name || "Customer / Guest"}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{selectedLog.performedByUser?.email || "No email"}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    {selectedLog.userRole || selectedLog.performedByUser?.role || "GUEST"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Audit Details</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-800 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-[11px]">
                  {selectedLog.details}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Record ID: <code className="text-slate-600">{selectedLog.id}</code></span>
                <span>IP: <code className="text-slate-600">{selectedLog.ipAddress || "Internal"}</code></span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
