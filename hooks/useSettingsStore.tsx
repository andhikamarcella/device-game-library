"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Settings } from "@/lib/types";
import { loadSettings, saveSettings } from "@/lib/storage";

export type SettingsContextValue = {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    theme: "dark",
    reduceMotion: false,
    highContrast: false,
    largeText: false,
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings({
      theme: "dark",
      reduceMotion: false,
      highContrast: false,
      largeText: false,
      ...loaded,
    });
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    saveSettings(settings);
  }, [initialized, settings]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const value = useMemo(() => ({ settings, updateSettings }), [settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsStore() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettingsStore must be used within a SettingsProvider");
  }
  return context;
}
