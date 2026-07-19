import { useState, useEffect } from "react";
import { X, Bell, CheckCircle2, Calendar, Shield, Trash2, Info } from "lucide-react";
import api from "../../api/client";
import { useToast } from "../../context/ToastContext";
import { formatDateTime } from "../../utils/helpers";

const defaultNotifications = [
  {
    id: "notif-1",
    title: "Company Holiday Reminder",
    message: "Independence Day holiday is upcoming on Saturday, 15 Aug 2026.",
    type: "info",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false,
  },
  {
    id: "notif-2",
    title: "Leave Policy Update",
    message: "Earned leave balance carry-forward policy updated for FY 2026-27.",
    type: "policy",
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    read: false,
  },
  {
    id: "notif-3",
    title: "Quarterly Performance Review",
    message: "Q3 Employee Performance Review self-appraisal window is open.",
    type: "review",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    read: false,
  },
];

export default function NotificationsModal({ isOpen, onClose }) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [filter, setFilter] = useState("all");

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
    async function fetchBackendNotifications() {
      try {
        const res = await api.get("/employee/notifications");
        if (res.data && res.data.length > 0) {
          const formatted = res.data.map((n, idx) => ({
            id: `backend-${idx}`,
            title: n.title || "Leave Application Event",
            message: n.message || "Your leave status was updated.",
            type: "leave",
            timestamp: n.timestamp || new Date().toISOString(),
            read: false,
          }));
          setNotifications((prev) => [...formatted, ...prev]);
        }
      } catch (e) {
        // ignore
      }
    }
    if (isOpen) {
      fetchBackendNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read.");
  };

  const clearAll = () => {
    setNotifications([]);
    toast.info("Notification log cleared.");
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "leave") return n.type === "leave";
    return true;
  });

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
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Notifications &amp; Activity Log</h3>
              <p className="text-xs text-slate-400">Stay updated on leave approvals, HR policies &amp; announcements.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs & Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filter === "all" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filter === "unread" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter("leave")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filter === "leave" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Leave Updates
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-[11px] font-semibold text-purple-400 hover:underline"
            >
              Mark read
            </button>
            <span className="text-slate-600">&bull;</span>
            <button
              onClick={clearAll}
              className="text-[11px] font-semibold text-rose-400 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>

        {/* Notification Cards List */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No notifications to display.
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-xl border transition-all text-xs space-y-1.5 ${
                  n.read
                    ? "bg-slate-900/40 border-slate-800/60 text-slate-400"
                    : "bg-slate-900/80 border-slate-700/80 text-slate-200 shadow-md shadow-purple-950/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-white">
                    {n.type === "leave" ? (
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>{n.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatDateTime(n.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
