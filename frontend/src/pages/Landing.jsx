import { Link, useNavigate } from "react-router-dom";
import { Sparkles, MessageSquare, Shield, CalendarCheck, Users, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = (role) => {
    navigate("/login", { state: { quickRole: role } });
  };

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex flex-col justify-between selection:bg-primary-500 selection:text-white">
      {/* Navbar */}
      <header className="px-6 lg:px-12 py-5 flex items-center justify-between border-b border-surface-800/60 bg-surface-900/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-400 flex items-center justify-center font-black text-xl text-white shadow-xl shadow-primary-500/20">
            HR
          </div>
          <span className="font-extrabold text-lg tracking-tight gradient-text">
            HR Assistant AI
          </span>
        </div>

        <div>
          {isAuthenticated ? (
            <Link
              to={user?.role === "admin" ? "/admin/dashboard" : "/dashboard"}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-primary-600/20 flex items-center gap-2"
            >
              Go to Portal <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-primary-600/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 text-center space-y-12">
        <div className="space-y-6 max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-300">
            <Sparkles className="w-3.5 h-3.5 text-accent-400 animate-pulse" />
            Next-Gen RAG Chatbot with Oxlo.ai &amp; DeepSeek V3.2
          </span>

          <h1 className="text-4xl sm:text-6xl font-black text-surface-100 tracking-tight leading-tight">
            Intelligent HR Assistant for <span className="gradient-text">Modern Enterprise</span>
          </h1>

          <p className="text-surface-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Instant policy answers, automated leave management, real-time analytics, and personalized employee self-service powered by Retrieval-Augmented Generation.
          </p>
        </div>

        {/* Demo Credentials Quick Login CTA */}
        <div className="glass max-w-xl mx-auto p-6 rounded-2xl border border-surface-700/60 bg-surface-900/80 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-surface-300">
            ⚡ Quick Demo Accounts
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleQuickLogin("employee")}
              className="p-4 rounded-xl glass border border-success-500/30 hover:border-success-500/60 bg-success-500/10 text-left transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-success-400">Employee Login</span>
                <ArrowRight className="w-4 h-4 text-success-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-surface-400">username: <code className="text-surface-200">employee</code></p>
              <p className="text-xs text-surface-400">password: <code className="text-surface-200">employee123</code></p>
            </button>

            <button
              onClick={() => handleQuickLogin("admin")}
              className="p-4 rounded-xl glass border border-accent-500/30 hover:border-accent-500/60 bg-accent-500/10 text-left transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm text-accent-400">Admin Login</span>
                <ArrowRight className="w-4 h-4 text-accent-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-xs text-surface-400">username: <code className="text-surface-200">admin</code></p>
              <p className="text-xs text-surface-400">password: <code className="text-surface-200">admin123</code></p>
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
          <div className="p-6 rounded-2xl glass border border-surface-800 text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-surface-100">RAG Chatbot</h4>
            <p className="text-xs text-surface-400 leading-relaxed">
              Streams answers token-by-token using 15 HR policy categories with exact source citations.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass border border-surface-800 text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-success-600/20 text-success-500 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-surface-100">Leave Workflow</h4>
            <p className="text-xs text-surface-400 leading-relaxed">
              Apply for leave with instant validation, date overlap checks, and balance management.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass border border-surface-800 text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-accent-600/20 text-accent-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-surface-100">Admin Portal</h4>
            <p className="text-xs text-surface-400 leading-relaxed">
              Approve or reject leave requests with mandatory reasons and audit trail logging.
            </p>
          </div>

          <div className="p-6 rounded-2xl glass border border-surface-800 text-left space-y-3">
            <div className="w-10 h-10 rounded-xl bg-warning-600/20 text-warning-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-base text-surface-100">Recharts Analytics</h4>
            <p className="text-xs text-surface-400 leading-relaxed">
              Interactive pie charts and monthly trend charts for leave distribution and employee directory search.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-surface-800/60 text-center text-xs text-surface-500">
        HR Assistant AI &copy; 2026 TechCorp Solutions. All rights reserved.
      </footer>
    </div>
  );
}
