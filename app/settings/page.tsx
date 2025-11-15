"use client";

import { useState } from "react";
import { Download, Upload, RotateCcw, MonitorSmartphone } from "lucide-react";
import { useTheme } from "next-themes";
import { Card } from "@/components/Card";
import { useDeviceStore } from "@/hooks/useDeviceStore";
import { useGameStore } from "@/hooks/useGameStore";
import { useSettingsStore } from "@/hooks/useSettingsStore";
import type { Device, Game } from "@/lib/types";

export default function SettingsPage() {
  const { devices, replaceDevices } = useDeviceStore();
  const { games, replaceGames } = useGameStore();
  const { settings, updateSettings } = useSettingsStore();
  const { theme, setTheme } = useTheme();
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const handleThemeChange = (value: string) => {
    setTheme(value);
    updateSettings({ theme: value as typeof settings.theme });
  };

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      devices,
      games,
      settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dglt-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    updateSettings({ lastBackupAt: new Date().toISOString() });
  };

  const handleImport = async (file: File) => {
    setImportError(null);
    setImportSuccess(null);
    try {
      const text = await file.text();
      const payload = JSON.parse(text) as {
        devices?: Device[];
        games?: Game[];
        settings?: Partial<typeof settings>;
      };
      if (!payload.devices || !payload.games) {
        throw new Error("Backup missing devices or games arrays");
      }
      const proceed = window.confirm("Importing will replace your current data. Continue?");
      if (!proceed) return;
      replaceDevices(payload.devices);
      replaceGames(payload.games);
      if (payload.settings) {
        updateSettings({ ...settings, ...payload.settings });
        if (payload.settings.theme) {
          setTheme(payload.settings.theme);
        }
      }
      setImportSuccess(`Imported ${payload.devices.length} devices and ${payload.games.length} games.`);
    } catch (error) {
      console.error(error);
      setImportError(error instanceof Error ? error.message : "Failed to import backup");
    }
  };

  const handleReset = (target: "devices" | "games" | "all") => {
    const message =
      target === "all"
        ? "Reset everything? This removes all devices, games, and settings."
        : target === "devices"
          ? "Remove all devices? Associated games will keep their platform names but no link."
          : "Remove all games from the library?";
    if (!window.confirm(message)) return;
    if (target === "devices" || target === "all") {
      replaceDevices([]);
    }
    if (target === "games" || target === "all") {
      replaceGames([]);
    }
    if (target === "all") {
      updateSettings({ theme: "dark", lastBackupAt: undefined });
      setTheme("dark");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Settings</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">Customize appearance and manage your data backups.</p>
      </div>

      <Card title="Theme" description="Switch between light and dark modes.">
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: "Light", value: "light" },
            { label: "Dark", value: "dark" },
            { label: "System", value: "system" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleThemeChange(option.value)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900 ${
                (theme ?? settings.theme) === option.value
                  ? "border-emerald-400 bg-emerald-100 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/20 dark:text-emerald-200"
                  : "border-slate-200 bg-white/80 text-slate-600 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Card>

      <Card
        title="Backup & Restore"
        description="Export your data to a JSON backup file or restore from one."
        action={
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100 dark:hover:text-emerald-50 dark:focus-visible:ring-offset-slate-900"
          >
            <Download className="h-4 w-4" /> Export data
          </button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:text-emerald-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:ring-offset-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-white dark:focus-within:ring-offset-slate-900"
            >
              <Upload className="h-4 w-4" />
              Import JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleImport(file);
                    event.target.value = "";
                  }
                }}
              />
            </label>
            {settings.lastBackupAt ? (
              <p className="text-xs text-slate-500">Last backup: {new Date(settings.lastBackupAt).toLocaleString()}</p>
            ) : null}
          </div>
          {importSuccess ? <p className="text-sm text-emerald-600 dark:text-emerald-300">{importSuccess}</p> : null}
          {importError ? <p className="text-sm text-rose-600 dark:text-rose-300">{importError}</p> : null}
        </div>
      </Card>

      <Card title="Data overview" description="Snapshot of what is stored in your browser.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-500">Devices</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{devices.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-500">Games</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{games.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-500">Theme</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{theme ?? settings.theme}</p>
          </div>
        </div>
      </Card>

      <Card title="Danger zone" description="Irreversible actions to clear your stored data.">
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => handleReset("devices")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/60 bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-700 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-amber-500/60 dark:bg-amber-500/20 dark:text-amber-200 dark:hover:text-amber-100 dark:focus-visible:ring-offset-slate-900"
          >
            <MonitorSmartphone className="h-4 w-4" /> Reset devices
          </button>
          <button
            type="button"
            onClick={() => handleReset("games")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/60 bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-rose-500/60 dark:bg-rose-500/20 dark:text-rose-200 dark:hover:text-rose-100 dark:focus-visible:ring-offset-slate-900"
          >
            <RotateCcw className="h-4 w-4" /> Reset games
          </button>
          <button
            type="button"
            onClick={() => handleReset("all")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/70 bg-rose-500/15 px-4 py-3 text-sm font-semibold text-rose-600 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-rose-600/70 dark:bg-rose-600/20 dark:text-rose-100 dark:hover:text-rose-50 dark:focus-visible:ring-offset-slate-900"
          >
            <RotateCcw className="h-4 w-4" /> Reset everything
          </button>
        </div>
      </Card>
    </div>
  );
}
