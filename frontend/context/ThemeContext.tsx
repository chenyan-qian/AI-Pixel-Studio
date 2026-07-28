"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { getUser } from "@/lib/auth";
import { readUserSettings } from "@/lib/user-settings";
import type { ThemePreference } from "@/lib/user-settings";

export type Theme = "light" | "dark";
interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}
const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "theme";

function resolveTheme(preference: ThemePreference): Theme {
  if (preference !== "system") return preference;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [preference, setPreference] = useState<ThemePreference>("dark");

  function setThemePreference(nextPreference: ThemePreference) {
    setPreference(nextPreference);
    window.localStorage.setItem(STORAGE_KEY, nextPreference);
  }

  useEffect(() => {
    const syncPreference = () => {
      const user = getUser();
      const saved = user ? readUserSettings(user.username).theme : window.localStorage.getItem(STORAGE_KEY);
      const nextPreference: ThemePreference = saved === "light" || saved === "dark" || saved === "system" ? saved : "dark";
      setPreference(nextPreference);
    };
    syncPreference();
    window.addEventListener("pixelverse-theme-change", syncPreference);
    return () => window.removeEventListener("pixelverse-theme-change", syncPreference);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const applyTheme = () => setTheme(resolveTheme(preference));
    applyTheme();
    if (preference === "system") mediaQuery.addEventListener("change", applyTheme);
    return () => mediaQuery.removeEventListener("change", applyTheme);
  }, [preference]);

  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);

  function toggleTheme() {
    setThemePreference(theme === "dark" ? "light" : "dark");
  }

  return <ThemeContext.Provider value={{ theme, preference, setThemePreference, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
