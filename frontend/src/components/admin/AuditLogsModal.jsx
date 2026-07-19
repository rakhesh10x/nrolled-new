import { useState, useEffect } from "react";
import { X, ShieldAlert, CheckCircle2, AlertTriangle, FileText, Download, Filter } from "lucide-react";
import api from "../../api/client";
import { formatDateTime } from "../../utils/helpers";

export default function AuditLogsModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    async function fetchAuditLogs() {
      if (!isOpen) return;
      setLoading(true);
      try {
        const res = await api.get("/admin/audit-logs");
        setLogs(res.data || []);
      } catch (e) {
        console.error("Failed to load audit logs:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLogs();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filterAction === "all") return true;
    return log.action === filterAction;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 bg-[#0F172A] text-slate-100 space-y-6 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">System Compliance Audit Trail</h3>
              <p className="text-xs text-slate-400">Immutable audit records of administrative reviews, approvals &amp; submissions.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all" className="bg-slate-900 text-slate-100">All Audit Events</option>
              <option value="LEAVE_APPROVED" className="bg-slate-900 text-slate-100">Leave Approved</option>
              <option value="LEAVE_REJECTED" className="bg-slate-900 text-slate-100">Leave Rejected</option>
              <option value="LEAVE_SUBMITTED" className="bg-slate-900 text-slate-100">Leave Submitted</option>
            </select>
          </div>

          <span className="text-slate-400 text-[11px] font-mono">
            Showing {filteredLogs.length} events
          </span>
        </div>

        {/* Audit Logs List */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-500">Loading audit trail records...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">No audit log entries matching filter.</div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {log.severity === "info" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {log.severity === "warning" && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                    {log.severity === "neutral" && <FileText className="w-4 h-4 text-indigo-400" />}
                    <span className="font-extrabold text-white font-mono uppercase text-[11px] tracking-wide">
                      {log.action}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed">{log.details}</p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <span>Actor: <strong className="text-purple-400">{log.actor}</strong></span>
                  <span>Target: <strong className="text-slate-200">{log.target}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
