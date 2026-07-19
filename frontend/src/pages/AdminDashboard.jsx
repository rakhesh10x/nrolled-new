import { useState, useEffect } from "react";
import { Users, Clock, CheckCircle2, XCircle, PieChart as PieIcon, BarChart2, Shield, Download, ShieldAlert } from "lucide-react";
import api from "../api/client";
import StatsCard from "../components/dashboard/StatsCard";
import { LeaveDistributionChart, MonthlyTrendsChart } from "../components/dashboard/LeaveChart";
import ActivityFeed from "../components/dashboard/ActivityFeed";
import { CardSkeleton } from "../components/common/Skeleton";
import PageTransition from "../components/common/PageTransition";
import AuditLogsModal from "../components/admin/AuditLogsModal";
import { useToast } from "../context/ToastContext";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [leaveDistribution, setLeaveDistribution] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLogsOpen, setAuditLogsOpen] = useState(false);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const [dashRes, distRes, trendRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/analytics/leave-distribution"),
          api.get("/admin/analytics/monthly-trends"),
        ]);

        setStats(dashRes.data);
        setLeaveDistribution(distRes.data || []);
        setMonthlyTrends(trendRes.data || []);
      } catch (err) {
        console.error("Failed to load admin dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminData();
  }, []);

  const handleExportCSV = async () => {
    try {
      toast.info("Generating CSV leave report...");
      const response = await api.get("/admin/export/csv", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `HR_Leave_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("CSV Report downloaded successfully!");
    } catch (err) {
      toast.error("Failed to export CSV report.");
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

  return (
    <PageTransition>
      <div className="space-y-8 select-none">
        {/* Banner */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-gradient-to-r from-purple-900/20 via-slate-900/80 to-indigo-900/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Admin Portal &amp; Workforce Analytics
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Real-time workforce metrics, leave approvals, department breakdowns, and compliance logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setAuditLogsOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Audit Logs</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-5 py-2.5 rounded-xl btn-gradient text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Report</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Employees"
            value={`${stats?.total_employees || 10}`}
            subtitle="Active company workforce"
            icon={Users}
            color="purple"
          />
          <StatsCard
            title="Pending Approvals"
            value={`${stats?.pending_leaves || 0}`}
            subtitle="Requires admin review"
            icon={Clock}
            color="amber"
          />
          <StatsCard
            title="Approved Leaves"
            value={`${stats?.approved_leaves || 0}`}
            subtitle="Total approved YTD"
            icon={CheckCircle2}
            color="emerald"
          />
          <StatsCard
            title="Rejected Leaves"
            value={`${stats?.rejected_leaves || 0}`}
            subtitle="Total rejected YTD"
            icon={XCircle}
            color="rose"
          />
        </div>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LeaveDistributionChart data={leaveDistribution} />
          <MonthlyTrendsChart data={monthlyTrends} />
        </div>

        {/* Recent Activity Feed */}
        <ActivityFeed activities={stats?.recent_activities || []} />

        {/* Audit Logs Modal */}
        <AuditLogsModal
          isOpen={auditLogsOpen}
          onClose={() => setAuditLogsOpen(false)}
        />
      </div>
    </PageTransition>
  );
}
