"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useSettingsStore } from "./useSettingsStore";

type ThemePreference = "light" | "dark" | "system";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (next: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemePreferenceContext = createContext<ThemeContextValue | undefined>(undefined);

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

function detectInitialTheme(): "light" | "dark" {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    const datasetTheme = root.dataset.theme;
    if (datasetTheme === "light" || datasetTheme === "dark") {
      return datasetTheme;
    }
    if (root.classList.contains("dark")) {
      return "dark";
    }
  }

  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return "dark";
}

function applyThemeClass(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "dark";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettingsStore();
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(detectInitialTheme);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.add("theme-ready");
    root.classList.remove("theme-initializing");
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (typeof document === "undefined") return;

    const preference: ThemePreference = settings.theme ?? "dark";
    const root = document.documentElement;
    root.dataset.themePreference = preference;

    const applyFromPreference = (value: ThemePreference) => {
      const nextTheme = value === "system" ? getSystemTheme() : value;
      setResolvedTheme(nextTheme);
      applyThemeClass(nextTheme);
    };

    applyFromPreference(preference);

    let media: MediaQueryList | null = null;
    const handleMediaChange = (event: MediaQueryListEvent) => {
      const next = event.matches ? "dark" : "light";
      setResolvedTheme(next);
      applyThemeClass(next);
    };

    if (preference === "system" && typeof window !== "undefined" && window.matchMedia) {
      media = window.matchMedia("(prefers-color-scheme: dark)");
      const initialNext = media.matches ? "dark" : "light";
      setResolvedTheme(initialNext);
      applyThemeClass(initialNext);

      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", handleMediaChange);
      } else if (typeof media.addListener === "function") {
        media.addListener(handleMediaChange);
      }
    }

    return () => {
      if (!media) return;
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", handleMediaChange);
      } else if (typeof media.removeListener === "function") {
        media.removeListener(handleMediaChange);
      }
    };
  }, [settings.theme]);

  const setTheme = useCallback(
    (next: ThemePreference) => {
      updateSettings({ theme: next });
    },
    [updateSettings],
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({
      theme: settings.theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [settings.theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

export function useThemePreference() {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error("useThemePreference must be used within a ThemePreferenceProvider");
  }
  return context;
}
