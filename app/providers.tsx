"use client";

import { ReactNode, useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { DeviceProvider } from "@/hooks/useDeviceStore";
import { GameProvider } from "@/hooks/useGameStore";
import { SettingsProvider, useSettingsStore } from "@/hooks/useSettingsStore";

function ThemeSettingsSync() {
  const { settings, updateSettings } = useSettingsStore();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!settings.theme) return;
    if (settings.theme !== theme) {
      setTheme(settings.theme);
    }
  }, [settings.theme, theme, setTheme]);

  useEffect(() => {
    if (!theme) return;
    if (theme !== settings.theme) {
      updateSettings({ theme: theme as typeof settings.theme });
    }
  }, [theme, settings.theme, updateSettings]);

  return null;
}

function AccessibilitySettingsSync() {
  const { settings } = useSettingsStore();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    const toggleClass = (className: string, enabled?: boolean) => {
      root.classList.toggle(className, Boolean(enabled));
    };

    toggleClass("accessibility-reduce-motion", settings.reduceMotion);
    toggleClass("accessibility-high-contrast", settings.highContrast);
    toggleClass("accessibility-large-text", settings.largeText);
  }, [settings.reduceMotion, settings.highContrast, settings.largeText]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SettingsProvider>
        <ThemeSettingsSync />
        <AccessibilitySettingsSync />
        <DeviceProvider>
          <GameProvider>{children}</GameProvider>
        </DeviceProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
