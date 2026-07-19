import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ToastContainer from "../common/Toast";
import SettingsModal from "../common/SettingsModal";
import NotificationsModal from "../common/NotificationsModal";

const titleMap = {
  "/dashboard": "Employee Dashboard",
  "/admin/dashboard": "Admin Analytics & Dashboard",
  "/chat": "AI HR Assistant",
  "/leave/apply": "Apply for Leave",
  "/leave/history": "Leave Request History",
  "/admin/leaves": "Leave Approval Management",
  "/admin/employees": "Employee Directory",
  "/profile": "Employee Profile",
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();

  const pageTitle = titleMap[location.pathname] || "HR Assistant";

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors duration-300">
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          setMobileOpen={setMobileOpen}
          pageTitle={pageTitle}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <ToastContainer />

      {/* Interactive System Modals */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
}
