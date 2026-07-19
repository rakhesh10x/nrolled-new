import { useState, useEffect } from "react";
import { User, Mail, Briefcase, Calendar, Shield, Award } from "lucide-react";
import api from "../api/client";
import { CardSkeleton } from "../components/common/Skeleton";
import PageTransition from "../components/common/PageTransition";
import { formatDate } from "../utils/helpers";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("/employee/profile");
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) return <CardSkeleton />;

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto space-y-6 py-6 select-none">
        {/* Profile Master Card */}
        <div className="bg-white dark:bg-[#0F172A] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-8 relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors duration-300">
          <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -z-10" />

          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left border-b border-slate-100 dark:border-slate-800/80 pb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-purple-600/30">
              {profile?.name?.[0] || "E"}
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{profile?.name}</h2>
              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{profile?.designation}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">{profile?.emp_id} &bull; {profile?.email}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Department
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white">{profile?.department}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Reporting Manager
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white">{profile?.manager || "N/A"}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Date of Joining
              </span>
              <p className="text-sm font-black text-slate-900 dark:text-white">{formatDate(profile?.date_of_joining)}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Attendance Percentage
              </span>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{profile?.attendance_pct}%</p>
            </div>
          </div>

          {/* Leave Breakdown Box */}
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 space-y-4 shadow-sm">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Annual Leave Breakdown
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 shadow-sm space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-bold">Casual Leave</span>
                <span className="font-black text-slate-900 dark:text-white text-base">{profile?.casual_leave_used} / 12 used</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 shadow-sm space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-bold">Sick Leave</span>
                <span className="font-black text-slate-900 dark:text-white text-base">{profile?.sick_leave_used} / 12 used</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/40 shadow-sm space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] font-bold">Earned Leave</span>
                <span className="font-black text-slate-900 dark:text-white text-base">{profile?.earned_leave_used} / 18 used</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
