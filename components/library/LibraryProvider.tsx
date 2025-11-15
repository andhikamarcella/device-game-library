"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { UserGameRow } from "@/lib/user-games";

type LibraryContextValue = {
  games: UserGameRow[];
  upsert: (game: UserGameRow) => void;
  replaceAll: (games: UserGameRow[]) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children, initialGames }: { children: ReactNode; initialGames: UserGameRow[] }) {
  const [games, setGames] = useState<UserGameRow[]>(initialGames);

  const value = useMemo<LibraryContextValue>(
    () => ({
      games,
      replaceAll: (next) => setGames(next),
      upsert: (game) =>
        setGames((current) => {
          const index = current.findIndex((item) => item.id === game.id);
          if (index === -1) {
            return [game, ...current];
          }
          const next = [...current];
          next[index] = game;
          return next;
        }),
    }),
    [games],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return ctx;
}
