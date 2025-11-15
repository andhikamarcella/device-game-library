"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { LibraryStats, Ownership, PlayStatus, UserGameEntry } from "@/lib/types";

const STORAGE_KEY = "DG_TRACKER_USER_GAMES";

const sanitizeEntry = (entry: UserGameEntry): UserGameEntry => ({
  ...entry,
  createdAt: entry.createdAt ?? new Date().toISOString(),
  updatedAt: entry.updatedAt ?? entry.createdAt ?? new Date().toISOString(),
  ownership: entry.ownership ?? "none",
  status: entry.status ?? "not_started",
  platforms: Array.isArray(entry.platforms) ? entry.platforms : [],
  personalRating: entry.personalRating ?? null,
  playtimeHours: entry.playtimeHours ?? 0,
  notes: entry.notes ?? "",
});

const defaultEntry = (entry: Omit<UserGameEntry, "createdAt" | "updatedAt">): UserGameEntry =>
  sanitizeEntry({ ...entry, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

const parseEntries = (raw: string | null): UserGameEntry[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as UserGameEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => sanitizeEntry(entry));
  } catch (error) {
    console.warn("Failed to parse user game entries", error);
    return [];
  }
};

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function save(entries: UserGameEntry[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export type LibraryState = {
  games: UserGameEntry[];
  addOrUpdateGame: (entry: Omit<UserGameEntry, "createdAt" | "updatedAt">) => void;
  updateGame: (rawgId: number, patch: Partial<UserGameEntry>) => void;
  removeGame: (rawgId: number) => void;
  getGame: (rawgId: number) => UserGameEntry | undefined;
  clearAll: () => void;
  replaceAll: (entries: UserGameEntry[]) => void;
  computeStats: () => LibraryStats;
  filterByOwnership: (ownership: Ownership[]) => UserGameEntry[];
  filterByStatus: (status: PlayStatus | "all") => UserGameEntry[];
};

export function useUserGameLibrary(): LibraryState {
  const [games, setGames] = useState<UserGameEntry[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isBrowser()) return;
    setGames(parseEntries(window.localStorage.getItem(STORAGE_KEY)));
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    save(games);
  }, [games, initialized]);

  const addOrUpdateGame = useCallback((entry: Omit<UserGameEntry, "createdAt" | "updatedAt">) => {
    setGames((prev) => {
      const existingIndex = prev.findIndex((game) => game.rawgId === entry.rawgId);
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const merged: UserGameEntry = {
          ...existing,
          ...entry,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
        };
        const copy = [...prev];
        copy[existingIndex] = merged;
        return copy;
      }
      return [defaultEntry(entry), ...prev];
    });
  }, []);

  const updateGame = useCallback((rawgId: number, patch: Partial<UserGameEntry>) => {
    setGames((prev) =>
      prev.map((game) =>
        game.rawgId === rawgId
          ? {
              ...game,
              ...patch,
              createdAt: game.createdAt,
              updatedAt: new Date().toISOString(),
            }
          : game,
      ),
    );
  }, []);

  const removeGame = useCallback((rawgId: number) => {
    setGames((prev) => prev.filter((game) => game.rawgId !== rawgId));
  }, []);

  const getGame = useCallback((rawgId: number) => games.find((game) => game.rawgId === rawgId), [games]);

  const clearAll = useCallback(() => {
    if (!isBrowser()) return;
    window.localStorage.removeItem(STORAGE_KEY);
    setGames([]);
  }, []);

  const replaceAll = useCallback((entries: UserGameEntry[]) => {
    setGames(entries.map((entry) => sanitizeEntry(entry)));
  }, []);

  const computeStats = useCallback((): LibraryStats => {
    if (!games.length) {
      return {
        totalGames: 0,
        totalCompleted: 0,
        totalPlaying: 0,
        totalWishlist: 0,
        totalPlaytime: 0,
        mostCommonPlatform: null,
        topGenres: [],
      };
    }

    const totals = games.reduce(
      (acc, game) => {
        acc.total += 1;
        if (game.status === "completed") acc.completed += 1;
        if (game.status === "playing") acc.playing += 1;
        if (game.ownership === "wishlist") acc.wishlist += 1;
        acc.playtime += game.playtimeHours ?? 0;

        game.platforms.forEach((platform) => {
          acc.platformCounts.set(platform, (acc.platformCounts.get(platform) ?? 0) + 1);
        });

        if (game.genres) {
          game.genres.forEach((genre) => {
            acc.genreCounts.set(genre, (acc.genreCounts.get(genre) ?? 0) + 1);
          });
        }

        return acc;
      },
      {
        total: 0,
        completed: 0,
        playing: 0,
        wishlist: 0,
        playtime: 0,
        platformCounts: new Map<string, number>(),
        genreCounts: new Map<string, number>(),
      },
    );

    let mostCommonPlatform: string | null = null;
    let maxCount = 0;
    totals.platformCounts.forEach((count, platform) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonPlatform = platform;
      }
    });

    const topGenres = Array.from(totals.genreCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([genre, count]) => ({ genre, count }));

    return {
      totalGames: totals.total,
      totalCompleted: totals.completed,
      totalPlaying: totals.playing,
      totalWishlist: totals.wishlist,
      totalPlaytime: totals.playtime,
      mostCommonPlatform,
      topGenres,
    };
  }, [games]);

  const filterByOwnership = useCallback(
    (ownership: Ownership[]) => games.filter((game) => ownership.includes(game.ownership)),
    [games],
  );

  const filterByStatus = useCallback(
    (status: PlayStatus | "all") => (status === "all" ? games : games.filter((game) => game.status === status)),
    [games],
  );

  return useMemo(
    () => ({
      games,
      addOrUpdateGame,
      updateGame,
      removeGame,
      getGame,
      clearAll,
      replaceAll,
      computeStats,
      filterByOwnership,
      filterByStatus,
    }),
    [games, addOrUpdateGame, updateGame, removeGame, getGame, clearAll, replaceAll, computeStats, filterByOwnership, filterByStatus],
  );
}

