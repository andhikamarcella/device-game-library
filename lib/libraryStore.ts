import { normalizeImageUrl } from "@/lib/images";

export type Ownership = "none" | "wishlist" | "owned_digital" | "owned_physical" | "emulator_only";
export type PlayStatus = "not_started" | "playing" | "beaten" | "completed" | "dropped";

export interface UserGame {
  igdbId: number;
  slug: string;
  title: string;
  platforms: string[];
  coverImage?: string | null;
  ownership: Ownership;
  status: PlayStatus;
  personalRating?: number | null;
  playtimeHours: number;
  lastPlayedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "dgtracker:userGames";

let inMemoryFallback: Record<string, string> | null = null;

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if (!inMemoryFallback) {
    inMemoryFallback = {};
  }
  return {
    get length() {
      return Object.keys(inMemoryFallback ?? {}).length;
    },
    clear() {
      inMemoryFallback = {};
    },
    getItem(key: string) {
      return inMemoryFallback?.[key] ?? null;
    },
    key(index: number) {
      return Object.keys(inMemoryFallback ?? {})[index] ?? null;
    },
    removeItem(key: string) {
      if (inMemoryFallback) {
        delete inMemoryFallback[key];
      }
    },
    setItem(key: string, value: string) {
      if (inMemoryFallback) {
        inMemoryFallback[key] = value;
      }
    },
  } as Storage;
}

function readStore(): UserGame[] {
  try {
    const storage = getStorage();
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is UserGame => item && typeof item === "object")
      .map((game) => ({
        ...game,
        coverImage: normalizeImageUrl(game.coverImage),
      }));
  } catch (error) {
    console.warn("Failed to parse user games from storage", error);
    return [];
  }
}

function writeStore(games: UserGame[]): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function getAllUserGames(): UserGame[] {
  return readStore();
}

export function getUserGame(igdbId: number): UserGame | undefined {
  return readStore().find((game) => game.igdbId === igdbId);
}

export function upsertUserGame(
  partial: Partial<Omit<UserGame, "igdbId" | "createdAt" | "updatedAt">> & {
    igdbId: number;
    slug: string;
    title: string;
  },
): UserGame {
  const games = readStore();
  const existing = games.find((game) => game.igdbId === partial.igdbId);
  const now = new Date().toISOString();

  if (existing) {
    const updated: UserGame = {
      ...existing,
      ...partial,
      coverImage: normalizeImageUrl(partial.coverImage ?? existing.coverImage),
      updatedAt: now,
    };
    const nextGames = games.map((game) => (game.igdbId === existing.igdbId ? updated : game));
    writeStore(nextGames);
    return updated;
  }

  const created: UserGame = {
    igdbId: partial.igdbId,
    slug: partial.slug,
    title: partial.title,
    platforms: partial.platforms ?? [],
    coverImage: normalizeImageUrl(partial.coverImage) ?? null,
    ownership: partial.ownership ?? "wishlist",
    status: partial.status ?? "not_started",
    personalRating: partial.personalRating ?? null,
    playtimeHours: partial.playtimeHours ?? 0,
    lastPlayedAt: partial.lastPlayedAt ?? null,
    notes: partial.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };
  const nextGames = [created, ...games];
  writeStore(nextGames);
  return created;
}

export function updateUserGame(igdbId: number, patch: Partial<UserGame>): UserGame | undefined {
  const games = readStore();
  const existing = games.find((game) => game.igdbId === igdbId);
  if (!existing) {
    return undefined;
  }
  const now = new Date().toISOString();
  const updated: UserGame = {
    ...existing,
    ...patch,
    coverImage: normalizeImageUrl(patch.coverImage ?? existing.coverImage),
    updatedAt: patch.updatedAt ?? now,
  };
  const nextGames = games.map((game) => (game.igdbId === igdbId ? updated : game));
  writeStore(nextGames);
  return updated;
}

export function removeUserGame(igdbId: number): void {
  const games = readStore();
  const nextGames = games.filter((game) => game.igdbId !== igdbId);
  writeStore(nextGames);
}
