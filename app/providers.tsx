"use client";

import { ReactNode, useEffect } from "react";
import { DeviceProvider } from "@/hooks/useDeviceStore";
import { GameProvider } from "@/hooks/useGameStore";
import { SettingsProvider, useSettingsStore } from "@/hooks/useSettingsStore";
import { ThemePreferenceProvider } from "@/hooks/useThemePreference";
import { PwaRegistration } from "@/components/PwaRegistration";

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

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ThemePreferenceProvider>
        <AccessibilitySettingsSync />
        <PwaRegistration />
        <DeviceProvider>
          <GameProvider>{children}</GameProvider>
        </DeviceProvider>
      </ThemePreferenceProvider>
    </SettingsProvider>
  );
}
