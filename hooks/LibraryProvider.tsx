"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getAllUserGames,
  getUserGame,
  removeUserGame,
  upsertUserGame,
  updateUserGame,
  type Ownership,
  type PlayStatus,
  type UserGame,
} from "@/lib/libraryStore";

export type LibraryContextValue = {
  games: UserGame[];
  loading: boolean;
  upsert: (
    input: Partial<Omit<UserGame, "igdbId" | "createdAt" | "updatedAt">> & {
      igdbId: number;
      slug: string;
      title: string;
    },
  ) => UserGame;
  update: (igdbId: number, patch: Partial<UserGame>) => UserGame | undefined;
  remove: (igdbId: number) => void;
  getById: (igdbId: number) => UserGame | undefined;
};

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

function sortGames(games: UserGame[]): UserGame[] {
  return [...games].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<UserGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrate = () => {
      const stored = getAllUserGames();
      setGames(sortGames(stored));
      setLoading(false);
    };

    hydrate();

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "dgtracker:userGames") {
        return;
      }
      hydrate();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, []);

  const upsertHandler = useCallback<LibraryContextValue["upsert"]>((input) => {
    const result = upsertUserGame(input);
    setGames((prev) => sortGames(prev.some((game) => game.igdbId === result.igdbId) ? prev.map((game) => (game.igdbId === result.igdbId ? result : game)) : [result, ...prev]));
    return result;
  }, []);

  const updateHandler = useCallback<LibraryContextValue["update"]>((igdbId, patch) => {
    const result = updateUserGame(igdbId, patch);
    if (result) {
      setGames((prev) => sortGames(prev.map((game) => (game.igdbId === igdbId ? result : game))));
    }
    return result;
  }, []);

  const removeHandler = useCallback((igdbId: number) => {
    removeUserGame(igdbId);
    setGames((prev) => prev.filter((game) => game.igdbId !== igdbId));
  }, []);

  const getByIdHandler = useCallback((igdbId: number) => getUserGame(igdbId), []);

  const value = useMemo<LibraryContextValue>(
    () => ({ games, loading, upsert: upsertHandler, update: updateHandler, remove: removeHandler, getById: getByIdHandler }),
    [games, loading, removeHandler, upsertHandler, updateHandler, getByIdHandler],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}

export type { Ownership, PlayStatus, UserGame };
