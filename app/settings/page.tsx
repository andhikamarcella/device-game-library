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
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-sm text-slate-400">Customize appearance and manage your data backups.</p>
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
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                (theme ?? settings.theme) === option.value
                  ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
                  : "border-slate-800 bg-slate-900 text-slate-300 hover:border-emerald-300 hover:text-white"
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
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-400 hover:text-white"
          >
            <Download className="h-4 w-4" /> Export data
          </button>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400 hover:text-white"
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
          {importSuccess ? <p className="text-sm text-emerald-300">{importSuccess}</p> : null}
          {importError ? <p className="text-sm text-rose-300">{importError}</p> : null}
        </div>
      </Card>

      <Card title="Data overview" description="Snapshot of what is stored in your browser.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">Devices</p>
            <p className="mt-2 text-3xl font-semibold text-white">{devices.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">Games</p>
            <p className="mt-2 text-3xl font-semibold text-white">{games.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">Theme</p>
            <p className="mt-2 text-sm text-slate-300">{theme ?? settings.theme}</p>
          </div>
        </div>
      </Card>

      <Card title="Danger zone" description="Irreversible actions to clear your stored data.">
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => handleReset("devices")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:border-amber-300 hover:text-white"
          >
            <MonitorSmartphone className="h-4 w-4" /> Reset devices
          </button>
          <button
            type="button"
            onClick={() => handleReset("games")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:border-rose-300 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" /> Reset games
          </button>
          <button
            type="button"
            onClick={() => handleReset("all")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-600/60 bg-rose-600/20 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-400 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" /> Reset everything
          </button>
        </div>
      </Card>
    </div>
  );
}
