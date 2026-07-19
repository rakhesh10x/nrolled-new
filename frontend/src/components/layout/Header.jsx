import { useState } from "react";
import { Menu, Bell, Sun, Moon, ChevronDown, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function Header({ setMobileOpen, pageTitle, onOpenSettings, onOpenNotifications }) {
  const { user, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const welcomeName = user?.employee_name || (isAdmin ? "Admin" : "Employee");

  return (
    <header className="sticky top-0 z-30 h-20 bg-white/90 dark:bg-[#0B1120]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-6 lg:px-10 flex items-center justify-between transition-colors duration-300">
      {/* Left section: Hamburger & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Welcome back, {welcomeName}! 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block mt-0.5">
            How can I help you today?
          </p>
        </div>
      </div>

      {/* Right section: Controls & Profile */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-200 border border-slate-200 dark:border-slate-800"
          title="Toggle Theme"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
          title="Open Notifications Log"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-500 ring-4 ring-white dark:ring-[#0B1120]" />
        </button>

        {/* Settings Icon */}
        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800 hidden sm:flex"
          title="System Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Avatar */}
        <div
          onClick={onOpenSettings}
          className="flex items-center gap-2 pl-2 cursor-pointer group"
          title="Account Settings"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
            {welcomeName[0]?.toUpperCase()}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 hidden sm:block group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
        </div>
      </div>
    </header>
  );
}
