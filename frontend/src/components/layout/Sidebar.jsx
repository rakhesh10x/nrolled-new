import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  CalendarPlus,
  History,
  User,
  Users,
  ClipboardList,
  LogOut,
  X,
  Sparkles,
  Bell,
  Settings,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ mobileOpen, setMobileOpen, onOpenSettings, onOpenNotifications }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const employeeLinks = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "AI Assistant", path: "/chat", icon: MessageSquare },
    { label: "Apply Leave", path: "/leave/apply", icon: CalendarPlus },
    { label: "Leave History", path: "/leave/history", icon: History },
    { label: "Profile", path: "/profile", icon: User },
  ];

  const adminLinks = [
    { label: "Admin Portal", path: "/admin/dashboard", icon: Shield },
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "AI Assistant", path: "/chat", icon: MessageSquare },
    { label: "Leave Requests", path: "/admin/leaves", icon: ClipboardList },
    { label: "Employee Directory", path: "/admin/employees", icon: Users },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-slate-800/80 p-5 text-slate-700 dark:text-slate-300 transition-colors duration-300 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 mb-2">
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform duration-200">
            HR
          </div>
          <div>
            <span className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight block">
              HR Assistant
            </span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" /> AI Powered RAG
            </span>
          </div>
        </Link>
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        <div>
          <nav className="space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path + link.label}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-xs transition-all duration-200 ${
                    isActive
                      ? "btn-gradient text-white font-black shadow-md shadow-purple-600/30"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-white" : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Other Section */}
        <div>
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3.5 mb-2">
            Other
          </div>
          <nav className="space-y-1">
            <div
              onClick={() => {
                setMobileOpen(false);
                if (onOpenNotifications) onOpenNotifications();
              }}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs font-semibold cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Notifications</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold text-[10px]">
                3
              </span>
            </div>

            <div
              onClick={() => {
                setMobileOpen(false);
                if (onOpenSettings) onOpenSettings();
              }}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Settings</span>
            </div>
          </nav>
        </div>
      </div>

      {/* User Footer Card */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 mt-auto">
        <div className="flex items-center justify-between p-2.5 rounded-2xl glass-panel border border-slate-200 dark:border-slate-800 hover:border-purple-500/30 transition-all cursor-pointer group">
          <div className="flex items-center gap-3 truncate">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-600/20 shrink-0">
              {user?.username?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {user?.employee_name || (isAdmin ? "Admin User" : "Employee User")}
              </p>
              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold capitalize truncate">
                {user?.role === "admin" ? "Administrator" : user?.department || "Employee"}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed 280px) */}
      <aside className="hidden lg:block w-[280px] shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-[280px] max-w-xs h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
