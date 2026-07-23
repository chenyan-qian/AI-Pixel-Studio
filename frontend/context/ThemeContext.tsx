"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";
interface ThemeContextValue { theme: Theme; toggleTheme: () => void; }
const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const nextTheme: Theme = saved === "light" || saved === "dark" ? saved : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  function toggleTheme() { setTheme((current) => { const next = current === "dark" ? "light" : "dark"; window.localStorage.setItem(STORAGE_KEY, next); return next; }); }
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
