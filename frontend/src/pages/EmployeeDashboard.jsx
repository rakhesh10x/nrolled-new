import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Briefcase,
  UserCheck,
  CalendarDays,
  Sparkles,
  ArrowRight,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldAlert,
} from "lucide-react";
import api from "../api/client";
import StatsCard from "../components/dashboard/StatsCard";
import LeaveTable from "../components/leave/LeaveTable";
import { CardSkeleton } from "../components/common/Skeleton";
import PageTransition from "../components/common/PageTransition";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/helpers";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'balance' | 'attendance' | 'used' | 'pending'
  const [cancellingUuid, setCancellingUuid] = useState(null);

  const fetchDashboard = async () => {
    try {
      const response = await api.get("/employee/dashboard");
      setStats(response.data);
    } catch (err) {
      console.error("Failed to load employee dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setActiveModal(null);
    };
    if (activeModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal]);

  const handleSelectSuggestion = (question) => {
    navigate("/chat", { state: { initialQuestion: question } });
  };

  const handleCancelLeave = async (uuid) => {
    setCancellingUuid(uuid);
    try {
      await api.post(`/employee/leave/${uuid}/cancel`);
      toast.success("Pending leave request cancelled successfully.");
      await fetchDashboard();
    } catch (e) {
      toast.error("Failed to cancel leave request.");
    } finally {
      setCancellingUuid(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  // Filter requests for modals
  const recentLeaves = stats?.recent_requests || [];
  const usedLeaves = recentLeaves.filter((l) => l.status === "APPROVED");
  const pendingLeaves = recentLeaves.filter((l) => l.status === "PENDING");

  return (
    <PageTransition>
      <div className="space-y-8 select-none">
        {/* Welcome Banner */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-gradient-to-r from-purple-900/20 via-slate-900/80 to-indigo-900/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Employee Self-Service
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.employee_name || "Employee"} 👋
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {user?.department || "Engineering"} Department &bull; Reporting Manager: {stats?.recent_requests?.[0]?.manager || "David Wilson"}
            </p>
          </div>

          <Link
            to="/leave/apply"
            className="px-5 py-3 rounded-xl btn-gradient text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 shrink-0"
          >
            <Calendar className="w-4 h-4" /> Apply for Leave
          </Link>
        </div>

        {/* Interactive Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Leave Balance"
            value={`${stats?.remaining_leave || 0} days`}
            subtitle="Available out of 18 annual days"
            icon={Calendar}
            color="purple"
            onClick={() => setActiveModal("balance")}
          />
          <StatsCard
            title="Attendance"
            value={`${stats?.attendance_pct || 96}%`}
            subtitle="Current month average"
            icon={Clock}
            color="emerald"
            onClick={() => setActiveModal("attendance")}
          />
          <StatsCard
            title="Leave Used"
            value={`${stats?.used_leave || 0} days`}
            subtitle="Casual, Sick & Earned used"
            icon={Briefcase}
            color="amber"
            onClick={() => setActiveModal("used")}
          />
          <StatsCard
            title="Pending Requests"
            value={`${stats?.pending_requests_count || 0}`}
            subtitle="Awaiting manager review"
            icon={UserCheck}
            color="indigo"
            onClick={() => setActiveModal("pending")}
          />
        </div>

        {/* AI Suggested Questions */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>AI HR Assistant Prompt Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {[
              "How many leave days do I have left?",
              "What is the casual leave policy?",
              "When is salary credited?",
              "What is the work from home policy?",
            ].map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(q)}
                className="text-xs px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-300 dark:hover:border-purple-700 transition-all text-left font-semibold shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Leave Requests & Upcoming Holidays Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Requests Table */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Recent Leave Applications
              </h3>
              <Link to="/leave/history" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <LeaveTable leaves={stats?.recent_requests || []} />
          </div>

          {/* Upcoming Holidays Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Upcoming Holidays
            </h3>

            <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-sm">
              {stats?.upcoming_holidays?.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-200">{h.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{h.day}</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800/50 font-mono font-bold">
                    {h.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE STATS MODALS */}
        {/* ========================================================================= */}

        {/* 1. Leave Balance Breakdown Modal */}
        {activeModal === "balance" && (
          <div
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in cursor-pointer select-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 bg-[#0F172A] text-slate-100 space-y-6 cursor-default"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Leave Balance Breakdown</h3>
                    <p className="text-xs text-slate-400">Detailed overview of annual leave quotas &amp; remaining balance.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-white text-sm">Total Available Balance</p>
                    <p className="text-slate-400 text-[11px]">Out of 18 annual allocated days</p>
                  </div>
                  <span className="text-2xl font-black text-purple-300">{stats?.remaining_leave || 0} Days</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold block">Casual Leave</span>
                    <span className="text-lg font-black text-white">10 / 12</span>
                    <span className="text-[10px] text-emerald-400 block font-semibold">10 Available</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold block">Sick Leave</span>
                    <span className="text-lg font-black text-white">11 / 12</span>
                    <span className="text-[10px] text-emerald-400 block font-semibold">11 Available</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-slate-400 font-bold block">Earned Leave</span>
                    <span className="text-lg font-black text-white">16 / 18</span>
                    <span className="text-[10px] text-emerald-400 block font-semibold">16 Available</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-slate-300">
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-400" /> Policy Guidelines:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-400">
                    <li>Casual Leave allows up to 3 consecutive days per application.</li>
                    <li>Sick Leave exceeding 2 days requires a medical certificate.</li>
                    <li>Earned Leave requires at least 3 days advance notice.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Attendance Details Modal */}
        {activeModal === "attendance" && (
          <div
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in cursor-pointer select-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 bg-[#0F172A] text-slate-100 space-y-6 cursor-default"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Attendance Summary</h3>
                    <p className="text-xs text-slate-400">Monthly attendance percentage &amp; presence tracking.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between">
                  <div>
                    <p className="font-extrabold text-white text-sm">Monthly Attendance Rate</p>
                    <p className="text-emerald-400 text-[11px] font-bold">Good Standing (Threshold: &gt;85%)</p>
                  </div>
                  <span className="text-3xl font-black text-emerald-400">{stats?.attendance_pct || 96}%</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Total Working Days (This Month)</span>
                    <span className="font-bold text-white">22 Days</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Days Present &amp; Worked</span>
                    <span className="font-bold text-emerald-400">21 Days</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Approved Paid Leaves</span>
                    <span className="font-bold text-purple-400">1 Day</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Unexcused Absences</span>
                    <span className="font-bold text-white">0 Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Leave Used Breakdown Modal */}
        {activeModal === "used" && (
          <div
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in cursor-pointer select-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 bg-[#0F172A] text-slate-100 space-y-6 cursor-default"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Leaves Used &amp; Approved Log</h3>
                    <p className="text-xs text-slate-400">Detailed list of all approved leaves with dates &amp; reasons.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 text-xs">
                {usedLeaves.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No approved leaves used yet.
                  </div>
                ) : (
                  usedLeaves.map((l) => (
                    <div
                      key={l.uuid || l.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-sm">{l.leave_type}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                          {l.days} Day{l.days > 1 ? "s" : ""} Approved
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Dates: <strong className="text-slate-200">{formatDate(l.start_date)}</strong> to <strong className="text-slate-200">{formatDate(l.end_date)}</strong></span>
                      </div>
                      <p className="text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 text-[11px]">
                        <strong>Reason:</strong> {l.reason}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. Pending Requests Modal */}
        {activeModal === "pending" && (
          <div
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in cursor-pointer select-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 bg-[#0F172A] text-slate-100 space-y-6 cursor-default"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Pending Leave Applications</h3>
                    <p className="text-xs text-slate-400">Applications currently awaiting manager review.</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 text-xs">
                {pendingLeaves.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No pending leave requests.
                  </div>
                ) : (
                  pendingLeaves.map((l) => (
                    <div
                      key={l.uuid || l.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-sm">{l.leave_type}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                          PENDING MANAGER APPROVAL
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Dates: <strong className="text-slate-200">{formatDate(l.start_date)}</strong> to <strong className="text-slate-200">{formatDate(l.end_date)}</strong> ({l.days} Day{l.days > 1 ? "s" : ""})</span>
                      </div>
                      <p className="text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 text-[11px]">
                        <strong>Reason:</strong> {l.reason}
                      </p>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleCancelLeave(l.uuid)}
                          disabled={cancellingUuid === l.uuid}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-[11px] font-bold transition-all disabled:opacity-40"
                        >
                          {cancellingUuid === l.uuid ? "Cancelling..." : "Cancel Request"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
