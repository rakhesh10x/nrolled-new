import { createContext, useContext, useEffect, useState } from "react";
import { STORAGE_KEYS } from "../utils/constants";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved) return saved;
    return "dark"; // Default to dark theme for premium enterprise aesthetic
  });

  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    if (theme === "dark") {
      body.classList.add("dark");
      html.classList.add("dark");
    } else {
      body.classList.remove("dark");
      html.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
