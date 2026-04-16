"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Settings } from "@/lib/types";
import { loadSettings, saveSettings } from "@/lib/storage";

export type SettingsContextValue = {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  initialized: boolean;
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  reduceMotion: false,
  highContrast: false,
  largeText: false,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === "undefined") {
      return { ...DEFAULT_SETTINGS };
    }

    const loaded = loadSettings();
    return { ...DEFAULT_SETTINGS, ...loaded };
  });
  const [initialized, setInitialized] = useState(() => typeof window !== "undefined");

  useEffect(() => {
    if (typeof window === "undefined" || initialized) return;
    const loaded = loadSettings();
    setSettings({ ...DEFAULT_SETTINGS, ...loaded });
    setInitialized(true);
  }, [initialized]);

  useEffect(() => {
    if (!initialized) return;
    saveSettings(settings);
  }, [initialized, settings]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings, initialized }),
    [settings, initialized, updateSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsStore() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettingsStore must be used within a SettingsProvider");
  }
  return context;
}
