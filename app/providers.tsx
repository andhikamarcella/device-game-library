"use client";

import { ReactNode, useEffect, useRef } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { DeviceProvider } from "@/hooks/useDeviceStore";
import { GameProvider } from "@/hooks/useGameStore";
import { SettingsProvider, useSettingsStore } from "@/hooks/useSettingsStore";

function ThemeSettingsSync() {
  const { settings, updateSettings, initialized } = useSettingsStore();
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.add("theme-ready");
    root.classList.remove("theme-initializing");
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const effective = (theme === "system" ? resolvedTheme : theme) ?? resolvedTheme ?? "dark";
    const next = effective === "dark" ? "dark" : "light";
    root.dataset.theme = next;
    root.dataset.themePreference = theme ?? next;
    root.style.colorScheme = next;
  }, [theme, resolvedTheme]);

  useEffect(() => {
    if (!initialized || !settings.theme) return;
    if (settings.theme !== theme) {
      setTheme(settings.theme);
    }
  }, [initialized, settings.theme, theme, setTheme]);

  useEffect(() => {
    if (!initialized || !theme) return;
    if (theme !== settings.theme) {
      updateSettings({ theme: theme as typeof settings.theme });
    }
  }, [initialized, theme, settings.theme, updateSettings]);

  return null;
}

function AccessibilitySettingsSync() {
  const { settings, initialized } = useSettingsStore();

  useEffect(() => {
    if (!initialized || typeof document === "undefined") return;
    const root = document.documentElement;

    const toggleClass = (className: string, enabled?: boolean) => {
      root.classList.toggle(className, Boolean(enabled));
    };

    toggleClass("accessibility-reduce-motion", settings.reduceMotion);
    toggleClass("accessibility-high-contrast", settings.highContrast);
    toggleClass("accessibility-large-text", settings.largeText);
  }, [initialized, settings.reduceMotion, settings.highContrast, settings.largeText]);

  return null;
}

function ThemedProviders({ children }: { children: ReactNode }) {
  const { settings } = useSettingsStore();
  const initialTheme = useRef(settings.theme ?? "dark");

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={initialTheme.current}
      enableSystem
      disableTransitionOnChange
    >
      <ThemeSettingsSync />
      <AccessibilitySettingsSync />
      <DeviceProvider>
        <GameProvider>{children}</GameProvider>
      </DeviceProvider>
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ThemedProviders>{children}</ThemedProviders>
    </SettingsProvider>
  );
}
