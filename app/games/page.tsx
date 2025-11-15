"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Star, Pencil, Trash2, Play, Filter } from "lucide-react";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { StatusBadge } from "@/components/StatusBadge";
import { TagPill } from "@/components/TagPill";
import { useDeviceStore } from "@/hooks/useDeviceStore";
import { useGameStore } from "@/hooks/useGameStore";
import type { GameDraft } from "@/hooks/useGameStore";
import { Game, GameFormat, GameStatus, Device } from "@/lib/types";
import { cn, formatDateTime, parseTags, sortGames, cycleStatus } from "@/lib/utils";

const statusFilters: Array<{ label: string; value: GameStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "Backlog", value: "backlog" },
  { label: "Playing", value: "playing" },
  { label: "Completed", value: "completed" },
  { label: "Dropped", value: "dropped" },
];

const formatOptions: GameFormat[] = ["rom", "cartridge", "disc", "digital"];

const statusOptions: GameStatus[] = ["backlog", "playing", "completed", "dropped"];

const sortOptions = [
  { label: "Title A-Z", value: "title-asc" },
  { label: "Title Z-A", value: "title-desc" },
  { label: "Last played", value: "last-played" },
  { label: "Rating high", value: "rating-desc" },
  { label: "Rating low", value: "rating-asc" },
];

type GameFormState = {
  title: string;
  platformId: string;
  platformName: string;
  region: string;
  status: GameStatus;
  format: GameFormat;
  source: string;
  fileName: string;
  folderPath: string;
  emulatorCore: string;
  shaderPreset: string;
  tags: string;
  rating: string;
  hoursPlayed: string;
  lastPlayedAt: string;
  notes: string;
  favorite: boolean;
};

const emptyFormState: GameFormState = {
  title: "",
  platformId: "",
  platformName: "",
  region: "",
  status: "backlog",
  format: "rom",
  source: "",
  fileName: "",
  folderPath: "",
  emulatorCore: "",
  shaderPreset: "",
  tags: "",
  rating: "",
  hoursPlayed: "",
  lastPlayedAt: "",
  notes: "",
  favorite: false,
};

function GameForm({
  value,
  onChange,
  devices,
}: {
  value: GameFormState;
  onChange: (value: GameFormState) => void;
  devices: Device[];
}) {
  const hasDevices = devices.length > 0;
  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";
  const labelClass = "text-sm font-medium text-slate-700 dark:text-slate-200";

  return (
    <div className="space-y-4">
      {!hasDevices ? (
        <div className="rounded-xl border border-amber-400/60 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          Add devices first so you can associate games with a platform.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Title</label>
          <input
            value={value.title}
            onChange={(event) => onChange({ ...value, title: event.target.value })}
            placeholder="The Legend of Zelda: Minish Cap"
            className={fieldClass}
            required
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Platform</label>
          <select
            value={value.platformId || "custom"}
            onChange={(event) => {
              const selected = event.target.value;
              if (selected === "custom") {
                onChange({ ...value, platformId: "" });
              } else {
                const device = devices.find((item) => item.id === selected);
                onChange({
                  ...value,
                  platformId: selected,
                  platformName: device ? device.name : value.platformName,
                });
              }
            }}
            className={fieldClass}
          >
            <option value="custom">Select device</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name}
              </option>
            ))}
          </select>
          <input
            value={value.platformName}
            onChange={(event) => onChange({ ...value, platformName: event.target.value })}
            placeholder="Custom platform name"
            className={`mt-2 ${fieldClass}`}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <label className={labelClass}>Status</label>
          <select
            value={value.status}
            onChange={(event) => onChange({ ...value, status: event.target.value as GameStatus })}
            className={fieldClass}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Format</label>
          <select
            value={value.format}
            onChange={(event) => onChange({ ...value, format: event.target.value as GameFormat })}
            className={fieldClass}
          >
            {formatOptions.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Region</label>
          <input
            value={value.region}
            onChange={(event) => onChange({ ...value, region: event.target.value })}
            placeholder="USA, EUR, JPN"
            className={fieldClass}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Tags</label>
          <input
            value={value.tags}
            onChange={(event) => onChange({ ...value, tags: event.target.value })}
            placeholder="rpg, backlog, gba"
            className={fieldClass}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">Comma-separated list, e.g. RPG, co-op.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>Rating</label>
            <input
              type="number"
              min={1}
              max={10}
              value={value.rating}
              onChange={(event) => onChange({ ...value, rating: event.target.value })}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Hours played</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={value.hoursPlayed}
              onChange={(event) => onChange({ ...value, hoursPlayed: event.target.value })}
              className={fieldClass}
            />
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Source</label>
          <input
            value={value.source}
            onChange={(event) => onChange({ ...value, source: event.target.value })}
            placeholder="ROM set, eShop, original"
            className={fieldClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>File name</label>
          <input
            value={value.fileName}
            onChange={(event) => onChange({ ...value, fileName: event.target.value })}
            placeholder="Pokemon - Fire Red (USA).gba"
            className={fieldClass}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Folder / Collection</label>
          <input
            value={value.folderPath}
            onChange={(event) => onChange({ ...value, folderPath: event.target.value })}
            placeholder="GBA/Completed"
            className={fieldClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Emulator core</label>
          <input
            value={value.emulatorCore}
            onChange={(event) => onChange({ ...value, emulatorCore: event.target.value })}
            placeholder="mgba"
            className={fieldClass}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className={labelClass}>Shader preset</label>
          <input
            value={value.shaderPreset}
            onChange={(event) => onChange({ ...value, shaderPreset: event.target.value })}
            placeholder="crt-guest-advanced-fast"
            className={fieldClass}
          />
        </div>
        <div className="space-y-1">
          <label className={labelClass}>Last played</label>
          <input
            type="datetime-local"
            value={value.lastPlayedAt}
            onChange={(event) => onChange({ ...value, lastPlayedAt: event.target.value })}
            className={fieldClass}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Notes</label>
        <textarea
          value={value.notes}
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
          rows={4}
          placeholder="Thoughts, achievements, tweaks..."
          className={fieldClass}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={value.favorite}
          onChange={(event) => onChange({ ...value, favorite: event.target.checked })}
          className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-400"
        />
        Mark as favorite
      </label>
    </div>
  );
}

function GameDetail({ game }: { game: Game }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{game.title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">{game.platformName}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={game.status} />
        <span className="rounded-full border border-slate-300 px-3 py-1 text-xs uppercase text-slate-700 dark:border-slate-700 dark:text-slate-300">{game.format}</span>
        {game.region ? (
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Region: {game.region}
          </span>
        ) : null}
        {game.favorite ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
            ★ Favorite
          </span>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          <p><span className="text-slate-500 dark:text-slate-500">Source:</span> {game.source || "—"}</p>
          <p><span className="text-slate-500 dark:text-slate-500">File:</span> {game.fileName || "—"}</p>
          <p><span className="text-slate-500 dark:text-slate-500">Folder:</span> {game.folderPath || "—"}</p>
          <p><span className="text-slate-500 dark:text-slate-500">Emulator core:</span> {game.emulatorCore || "—"}</p>
          <p><span className="text-slate-500 dark:text-slate-500">Shader:</span> {game.shaderPreset || "—"}</p>
        </div>
        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          <p><span className="text-slate-500 dark:text-slate-500">Rating:</span> {game.rating ?? "—"}</p>
          <p><span className="text-slate-500 dark:text-slate-500">Hours:</span> {game.hoursPlayed ?? "—"}</p>
          <p><span className="text-slate-500 dark:text-slate-500">Last played:</span> {formatDateTime(game.lastPlayedAt)}</p>
          <p><span className="text-slate-500 dark:text-slate-500">Created:</span> {formatDateTime(game.createdAt)}</p>
        </div>
      </div>
      {game.tags.length ? (
        <div className="flex flex-wrap gap-2">
          {game.tags.map((tag) => (
            <TagPill key={tag} label={tag} />
          ))}
        </div>
      ) : null}
      {game.notes ? (
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Notes</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">{game.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function GamesPage() {
  const { devices } = useDeviceStore();
  const {
    games,
    addGame,
    updateGame,
    deleteGame,
    toggleFavoriteGame,
    setStatus,
    markPlayed,
    filters,
    setStatusFilter,
    setPlatformFilter,
    setFormatFilter,
    toggleFavoritesOnly,
    setSortOrder,
    draftGame,
    clearDraftGame,
  } = useGameStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [formState, setFormState] = useState<GameFormState>(emptyFormState);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    if (draftGame) {
      setEditingGame(null);
      setFormState({
        ...emptyFormState,
        ...convertDraftToForm(draftGame),
      });
      setIsModalOpen(true);
      clearDraftGame();
    }
  }, [draftGame, clearDraftGame]);

  const filteredGames = useMemo(() => {
    let result = [...games];
    if (filters.searchTerm) {
      const query = filters.searchTerm.toLowerCase();
      result = result.filter((game) =>
        `${game.title} ${game.tags.join(" ")}`.toLowerCase().includes(query),
      );
    }
    if (filters.status !== "all") {
      result = result.filter((game) => game.status === filters.status);
    }
    if (filters.platformId !== "all") {
      result = result.filter((game) => game.platformId === filters.platformId);
    }
    if (filters.format !== "all") {
      result = result.filter((game) => game.format === filters.format);
    }
    if (filters.favoritesOnly) {
      result = result.filter((game) => game.favorite);
    }
    return sortGames(result, filters.sortOrder);
  }, [games, filters]);

  const currentGame = selectedGameId ? games.find((game) => game.id === selectedGameId) ?? null : null;

  const openAddModal = () => {
    setEditingGame(null);
    setFormState(emptyFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (game: Game) => {
    setEditingGame(game);
    setFormState(convertGameToForm(game));
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formState.title.trim()) return;
    const device = devices.find((item) => item.id === formState.platformId);
    const tags = parseTags(formState.tags);
    const rating = formState.rating ? Number(formState.rating) : undefined;
    const hours = formState.hoursPlayed ? Number(formState.hoursPlayed) : undefined;
    const newGameData: Omit<Game, "id" | "createdAt"> = {
      title: formState.title,
      platformId: formState.platformId || formState.platformName || "custom",
      platformName: device ? device.name : formState.platformName || "Unknown",
      region: formState.region || undefined,
      status: formState.status,
      format: formState.format,
      source: formState.source || undefined,
      fileName: formState.fileName || undefined,
      folderPath: formState.folderPath || undefined,
      emulatorCore: formState.emulatorCore || undefined,
      shaderPreset: formState.shaderPreset || undefined,
      tags,
      rating,
      hoursPlayed: hours,
      lastPlayedAt: formState.lastPlayedAt || undefined,
      notes: formState.notes || undefined,
      favorite: formState.favorite,
    };

    if (editingGame) {
      updateGame(editingGame.id, newGameData);
    } else {
      addGame(newGameData);
    }
    setIsModalOpen(false);
    setEditingGame(null);
    setFormState(emptyFormState);
  };

  const handleDelete = (game: Game) => {
    if (window.confirm(`Delete ${game.title}?`)) {
      deleteGame(game.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Games library</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Keep track of ROMs, physical copies, and digital purchases.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100 dark:hover:text-emerald-50 dark:focus-visible:ring-offset-slate-900"
        >
          <Plus className="h-4 w-4" /> Add game
        </button>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors duration-200",
                  filters.status === filter.value
                    ? "bg-emerald-500/30 text-emerald-700 dark:text-emerald-200"
                    : "bg-slate-200 text-slate-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:bg-slate-900 dark:text-slate-300",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <select
                value={filters.platformId}
                onChange={(event) => setPlatformFilter(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="all">All platforms</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filters.format}
                onChange={(event) => setFormatFilter(event.target.value as GameFormat | "all")}
                className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="all">All formats</option>
                {formatOptions.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filters.sortOrder}
                onChange={(event) => setSortOrder(event.target.value as typeof filters.sortOrder)}
                className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={toggleFavoritesOnly}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900",
                filters.favoritesOnly
                  ? "border-amber-400/70 bg-amber-100 text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/20 dark:text-amber-200"
                  : "border-slate-200 bg-white/80 text-slate-600 shadow-sm hover:-translate-y-0.5 hover:border-amber-300 hover:text-amber-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
              )}
              aria-pressed={filters.favoritesOnly}
            >
              Favorites only
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 shadow-sm shadow-slate-900/10 dark:border-slate-800">
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800" aria-label="Games list">
            <thead className="bg-slate-100/80 text-left text-xs uppercase tracking-wider text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3">Title</th>
                <th scope="col" className="px-4 py-3">Platform</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Format</th>
                <th scope="col" className="px-4 py-3">Tags</th>
                <th scope="col" className="px-4 py-3">Rating</th>
                <th scope="col" className="px-4 py-3">Last played</th>
                <th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
              {filteredGames.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
                    No games match the current filters.
                  </td>
                </tr>
              ) : (
                filteredGames.map((game) => (
                  <tr
                    key={game.id}
                    className="cursor-pointer transition-colors hover:bg-emerald-500/5 dark:hover:bg-slate-900/60"
                    onClick={() => setSelectedGameId(game.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleFavoriteGame(game.id);
                          }}
                          className={cn(
                            "rounded-full p-1 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900",
                            game.favorite
                              ? "text-amber-500 dark:text-amber-400"
                              : "text-slate-400 hover:-translate-y-0.5 hover:text-amber-400",
                          )}
                          aria-label={game.favorite ? "Remove favorite" : "Mark as favorite"}
                          aria-pressed={game.favorite ?? false}
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </button>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{game.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Added {formatDateTime(game.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{game.platformName}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setStatus(game.id, cycleStatus(game.status));
                        }}
                        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900"
                        aria-label={`Cycle status for ${game.title}`}
                      >
                        <StatusBadge status={game.status} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{game.format}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {game.tags.slice(0, 3).map((tag) => (
                          <TagPill key={tag} label={tag} />
                        ))}
                        {game.tags.length > 3 ? (
                          <span className="text-xs text-slate-500 dark:text-slate-400">+{game.tags.length - 3} more</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{game.rating ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{formatDateTime(game.lastPlayedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            markPlayed(game.id);
                          }}
                          className="rounded-xl border border-emerald-500/40 bg-emerald-500/90 p-2 text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100 dark:hover:text-emerald-50 dark:focus-visible:ring-offset-slate-900"
                          aria-label="Play now"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditModal(game);
                          }}
                          className="rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-500/60 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
                          aria-label="Edit game"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(game);
                          }}
                          className="rounded-xl border border-rose-400/60 bg-rose-500/10 p-2 text-rose-500 transition-transform duration-200 hover:-translate-y-0.5 hover:border-rose-400 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:text-rose-100 dark:focus-visible:ring-offset-slate-900"
                          aria-label="Delete game"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

      </Card>

      <Modal
        title={editingGame ? "Edit game" : "Add game"}
        description="Organise games with metadata and notes."
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          clearDraftGame();
        }}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                clearDraftGame();
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100 dark:hover:text-emerald-50 dark:focus-visible:ring-offset-slate-900"
            >
              {editingGame ? "Save changes" : "Add game"}
            </button>
          </>
        }
      >
        <GameForm value={formState} onChange={setFormState} devices={devices} />
      </Modal>

      <Modal
        title="Game details"
        description="Deep dive into the metadata for this game."
        open={Boolean(currentGame)}
        onClose={() => setSelectedGameId(null)}
        size="lg"
      >
        {currentGame ? <GameDetail game={currentGame} /> : null}
      </Modal>
    </div>
  );
}

function convertGameToForm(game: Game): GameFormState {
  return {
    title: game.title,
    platformId: game.platformId,
    platformName: game.platformName,
    region: game.region ?? "",
    status: game.status,
    format: game.format,
    source: game.source ?? "",
    fileName: game.fileName ?? "",
    folderPath: game.folderPath ?? "",
    emulatorCore: game.emulatorCore ?? "",
    shaderPreset: game.shaderPreset ?? "",
    tags: game.tags.join(", "),
    rating: game.rating?.toString() ?? "",
    hoursPlayed: game.hoursPlayed?.toString() ?? "",
    lastPlayedAt: game.lastPlayedAt ? game.lastPlayedAt.slice(0, 16) : "",
    notes: game.notes ?? "",
    favorite: Boolean(game.favorite),
  };
}

function convertDraftToForm(draft: NonNullable<GameDraft>): Partial<GameFormState> {
  return {
    title: draft.title ?? "",
    platformId: draft.platformId ?? "",
    platformName: draft.platformName ?? "",
    region: draft.region ?? "",
    status: draft.status ?? "backlog",
    format: draft.format ?? "rom",
    source: draft.source ?? "",
    fileName: draft.fileName ?? "",
    folderPath: draft.folderPath ?? "",
    emulatorCore: draft.emulatorCore ?? "",
    shaderPreset: draft.shaderPreset ?? "",
    tags: draft.tags ? draft.tags.join(", ") : "",
    rating: draft.rating !== undefined ? String(draft.rating) : "",
    hoursPlayed: draft.hoursPlayed !== undefined ? String(draft.hoursPlayed) : "",
    lastPlayedAt: draft.lastPlayedAt ? draft.lastPlayedAt.slice(0, 16) : "",
    notes: draft.notes ?? "",
    favorite: Boolean(draft.favorite),
  };
}
