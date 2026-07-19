import { useState, useEffect } from "react";
import { X, Moon, Sun, Bell, Shield, Check, User, Lock, Globe } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";

export default function SettingsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [leaveStatusAlerts, setLeaveStatusAlerts] = useState(true);
  const [announcements, setAnnouncements] = useState(true);
  const [language, setLanguage] = useState("English (US)");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    setSaved(true);
    toast.success("Settings & preferences saved successfully!");
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg glass-panel rounded-2xl border border-slate-700/80 shadow-2xl p-6 bg-[#0F172A] text-slate-100 space-y-6 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">System Settings</h3>
              <p className="text-xs text-slate-400">Manage account preferences &amp; application parameters.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-1">
          {/* Section 1: User Profile Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-purple-400" /> Account Profile
            </h4>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Username</span>
                <span className="font-bold text-white">{user?.username}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Full Name</span>
                <span className="font-bold text-white">{user?.employee_name || "Enterprise User"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Access Role</span>
                <span className="font-bold text-purple-400 capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Department</span>
                <span className="font-bold text-slate-200">{user?.department || "Engineering"}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Appearance & Theme */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              {isDark ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />} Appearance &amp; Locale
            </h4>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">Theme Preference</p>
                  <p className="text-[11px] text-slate-400">Current: {isDark ? "Dark Theme" : "Light Theme"}</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 font-bold transition-all"
                >
                  Switch to {isDark ? "Light Mode" : "Dark Mode"}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" /> System Language
                </span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                >
                  <option value="English (US)" className="bg-slate-900 text-slate-100">English (US)</option>
                  <option value="Spanish" className="bg-slate-900 text-slate-100">Spanish</option>
                  <option value="French" className="bg-slate-900 text-slate-100">French</option>
                  <option value="German" className="bg-slate-900 text-slate-100">German</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Notification Toggles */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-purple-400" /> Notification Channels
            </h4>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-medium text-slate-200">Email Notifications on Leave Approval/Rejection</span>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-slate-800/60 pt-3">
                <span className="font-medium text-slate-200">Instant Toast Notifications</span>
                <input
                  type="checkbox"
                  checked={leaveStatusAlerts}
                  onChange={(e) => setLeaveStatusAlerts(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-slate-800/60 pt-3">
                <span className="font-medium text-slate-200">Company Announcements &amp; HR Policy Updates</span>
                <input
                  type="checkbox"
                  checked={announcements}
                  onChange={(e) => setAnnouncements(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Section 4: Security & Session */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> Security &amp; Session
            </h4>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">JWT Token Status</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Active (24h Expiration)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Password Hash</span>
                <span className="font-bold text-slate-300 font-mono">Bcrypt (Salted)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl btn-gradient text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2"
          >
            {saved ? <Check className="w-4 h-4" /> : "Save Preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
