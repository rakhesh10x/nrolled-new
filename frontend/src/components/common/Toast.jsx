import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const icons = {
  success: <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning-500 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-error-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-primary-400 shrink-0" />,
};

const borders = {
  success: "border-success-500/30",
  warning: "border-warning-500/30",
  error: "border-error-500/30",
  info: "border-primary-500/30",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl glass border ${
            borders[toast.type] || borders.info
          } shadow-xl toast-enter transition-all duration-300 bg-surface-900/90 text-surface-100`}
        >
          {icons[toast.type] || icons.info}
          <div className="flex-1 text-sm font-medium leading-snug">
            {toast.message}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-surface-400 hover:text-surface-100 transition-colors p-1 rounded-lg hover:bg-surface-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
