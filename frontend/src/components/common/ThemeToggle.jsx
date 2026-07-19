import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      className="p-2.5 rounded-xl text-surface-400 hover:text-surface-100 hover:bg-surface-800/60 transition-all duration-200 border border-transparent hover:border-surface-700/50"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-warning-500" />
      ) : (
        <Moon className="w-5 h-5 text-primary-400" />
      )}
    </button>
  );
}
