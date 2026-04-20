"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") return getSystemTheme();
  return theme;
}

function applyTheme(theme: Theme) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved === "dark" ? "dark" : "light";
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: string) => void;
  resolvedTheme: "light" | "dark" | undefined;
  systemTheme: "light" | "dark" | undefined;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

/** مزوّد مظهر بدون حقن سكربت في شجرة React — متوافق مع React 19 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, mounted]);

  React.useEffect(() => {
    if (!mounted || theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [theme, mounted]);

  const setTheme = React.useCallback((t: string) => {
    if (t === "light" || t === "dark" || t === "system") setThemeState(t);
  }, []);

  const resolvedTheme = mounted ? resolveTheme(theme) : undefined;
  const systemTheme = mounted ? getSystemTheme() : undefined;

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      systemTheme,
    }),
    [theme, setTheme, resolvedTheme, systemTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme يجب أن يُستخدَم داخل ThemeProvider");
  return ctx;
}
