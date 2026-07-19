import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Layout from "./components/layout/Layout";
import LoadingSpinner from "./components/common/LoadingSpinner";

// Lazy-loaded Page Components for optimal code splitting & fast initial page load
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Chat = lazy(() => import("./pages/Chat"));
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const LeaveApplication = lazy(() => import("./pages/LeaveApplication"));
const LeaveHistory = lazy(() => import("./pages/LeaveHistory"));
const AdminLeaves = lazy(() => import("./pages/AdminLeaves"));
const AdminEmployees = lazy(() => import("./pages/AdminEmployees"));
const Profile = lazy(() => import("./pages/Profile"));

function DefaultRedirect() {
  const { user } = useAuth();
  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense
              fallback={
                <div className="min-h-screen bg-surface-950 flex items-center justify-center text-surface-100">
                  <LoadingSpinner size="lg" label="Loading HR Assistant..." />
                </div>
              }
            >
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Application Portal Layout */}
                <Route
                  element={
                    <ProtectedRoute allowedRoles={["employee", "admin"]}>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/app" element={<DefaultRedirect />} />

                  {/* Employee & Shared Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <EmployeeDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/chat" element={<Chat />} />
                  <Route
                    path="/leave/apply"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <LeaveApplication />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/leave/history"
                    element={
                      <ProtectedRoute allowedRoles={["employee"]}>
                        <LeaveHistory />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/profile" element={<Profile />} />

                  {/* Admin Routes */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/leaves"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminLeaves />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/employees"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminEmployees />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* Catch-all Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
