import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, User, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "../components/common/LoadingSpinner";

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle quick role login passed from Landing page
  useEffect(() => {
    if (location.state?.quickRole === "employee") {
      setUsername("employee");
      setPassword("employee123");
    } else if (location.state?.quickRole === "admin") {
      setUsername("admin");
      setPassword("admin123");
    }
  }, [location.state]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const dest = user?.role === "admin" ? "/admin/dashboard" : "/dashboard";
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in both username and password.");
      return;
    }

    setLoading(true);

    try {
      const loggedUser = await login(username.trim(), password.trim());
      toast.success(`Welcome back, ${loggedUser.employee_name || loggedUser.username}!`);
      const dest = loggedUser.role === "admin" ? "/admin/dashboard" : "/dashboard";
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail?.error || "Invalid username or password.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-surface-950 text-surface-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-400 flex items-center justify-center text-white font-black text-2xl mx-auto shadow-xl shadow-primary-500/20">
            HR
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-surface-100">
            Sign in to HR Assistant
          </h1>
          <p className="text-xs text-surface-400">
            Enter your credentials to access the employee or admin portal.
          </p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDemoCredentials("employee", "employee123")}
            className="p-2.5 rounded-xl glass border border-success-500/30 hover:border-success-500/60 text-xs font-semibold text-success-400 transition-all text-center"
          >
            Fill Employee Creds
          </button>
          <button
            type="button"
            onClick={() => setDemoCredentials("admin", "admin123")}
            className="p-2.5 rounded-xl glass border border-accent-500/30 hover:border-accent-500/60 text-xs font-semibold text-accent-400 transition-all text-center"
          >
            Fill Admin Creds
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="glass p-6 rounded-2xl border border-surface-800 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-error-500/15 border border-error-500/30 text-error-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-surface-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="employee or admin"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700/60 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-surface-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700/60 text-sm text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
          >
            {loading ? <LoadingSpinner size="sm" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-[11px] text-surface-500 text-center">
          Employee: employee / employee123 &bull; Admin: admin / admin123
        </p>
      </div>
    </div>
  );
}
