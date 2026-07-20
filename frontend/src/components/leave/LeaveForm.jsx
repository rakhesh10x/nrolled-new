import { useState } from "react";
import { Calendar, AlertCircle, Send } from "lucide-react";
import api from "../../api/client";
import { useToast } from "../../context/ToastContext";
import LoadingSpinner from "../common/LoadingSpinner";

export default function LeaveForm({ onSuccess }) {
  const { toast } = useToast();
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError("Start date cannot be after end date.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for your leave request.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/employee/leave/apply", {
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
      });

      toast.success("Leave request submitted successfully!");
      setReason("");
      setStartDate("");
      setEndDate("");
      if (onSuccess) onSuccess();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errMsg = typeof detail === "string" ? detail : detail?.error || "Failed to submit leave request.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel p-8 rounded-2xl space-y-6 max-w-xl mx-auto border border-slate-800/80 shadow-2xl select-none"
    >
      <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5">
        <div className="p-3 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white tracking-tight">Apply for Leave</h2>
          <p className="text-xs text-slate-400">Submit a new leave request for manager approval.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            Leave Type
          </label>
          <select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer"
          >
            <option value="Casual Leave" className="bg-slate-900 text-slate-100">Casual Leave (12 days/yr)</option>
            <option value="Sick Leave" className="bg-slate-900 text-slate-100">Sick Leave (12 days/yr)</option>
            <option value="Earned Leave" className="bg-slate-900 text-slate-100">Earned Leave (18 days/yr)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
            Reason for Leave
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide details about the reason for your leave request..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 px-6 rounded-xl btn-gradient text-white font-extrabold text-xs transition-all duration-200 shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] cursor-pointer disabled:opacity-40"
      >
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Submit Leave Application</span>
          </>
        )}
      </button>
    </form>
  );
}
