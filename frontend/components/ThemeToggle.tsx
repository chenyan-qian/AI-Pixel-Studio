"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return <button type="button" onClick={toggleTheme} title={isDark ? "切换浅色模式" : "切换深色模式"} aria-label={isDark ? "切换浅色模式" : "切换深色模式"} className="theme-toggle grid size-9 place-items-center border transition">{isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>;
}
