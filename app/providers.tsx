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

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <SettingsProvider>
        <ThemeSettingsSync />
        <DeviceProvider>
          <GameProvider>{children}</GameProvider>
        </DeviceProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
