"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Game, GameFormat, GameStatus } from "@/lib/types";
import { loadGames, saveGames } from "@/lib/storage";
import { cycleStatus } from "@/lib/utils";

export type GameSortOrder = "title-asc" | "title-desc" | "last-played" | "rating-desc" | "rating-asc";

export type GameFilters = {
  searchTerm: string;
  platformTerm: string;
  status: GameStatus | "all";
  platformId: string | "all";
  format: GameFormat | "all";
  favoritesOnly: boolean;
  wishlistOnly: boolean;
  sortOrder: GameSortOrder;
};

export type GameDraft = Partial<Omit<Game, "id" | "createdAt">> | null;

export type GameStoreContextValue = {
  games: Game[];
  addGame: (game: Omit<Game, "id" | "createdAt">) => void;
  updateGame: (id: string, updates: Partial<Game>) => void;
  deleteGame: (id: string) => void;
  setStatus: (id: string, status: GameStatus) => void;
  toggleFavoriteGame: (id: string) => void;
  toggleWishlistGame: (id: string) => void;
  markPlayed: (id: string) => void;
  replaceGames: (items: Game[]) => void;
  filters: GameFilters;
  setSearchTerm: (value: string) => void;
  setPlatformTerm: (value: string) => void;
  setStatusFilter: (value: GameFilters["status"]) => void;
  setPlatformFilter: (value: GameFilters["platformId"]) => void;
  setFormatFilter: (value: GameFilters["format"]) => void;
  toggleFavoritesOnly: () => void;
  toggleWishlistOnly: () => void;
  setSortOrder: (value: GameSortOrder) => void;
  getGameById: (id: string) => Game | undefined;
  draftGame: GameDraft;
  setDraftGame: (draft: GameDraft) => void;
  clearDraftGame: () => void;
};

const defaultFilters: GameFilters = {
  searchTerm: "",
  platformTerm: "",
  status: "all",
  platformId: "all",
  format: "all",
  favoritesOnly: false,
  wishlistOnly: false,
  sortOrder: "title-asc",
};

const GameStoreContext = createContext<GameStoreContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [filters, setFilters] = useState<GameFilters>(defaultFilters);
  const [draftGame, setDraftGame] = useState<GameDraft>(null);

  useEffect(() => {
    const loaded = loadGames();
    setGames(loaded);
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    saveGames(games);
  }, [games, initialized]);

  const addGame = (game: Omit<Game, "id" | "createdAt">) => {
    setGames((prev) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...game,
      },
      ...prev,
    ]);
  };

  const updateGame = (id: string, updates: Partial<Game>) => {
    setGames((prev) => prev.map((game) => (game.id === id ? { ...game, ...updates } : game)));
  };

  const deleteGame = (id: string) => {
    setGames((prev) => prev.filter((game) => game.id !== id));
  };

  const replaceGames = (items: Game[]) => {
    setGames(items);
  };

  const setStatus = (id: string, status: GameStatus) => {
    updateGame(id, { status });
  };

  const toggleFavoriteGame = (id: string) => {
    setGames((prev) =>
      prev.map((game) =>
        game.id === id
          ? {
              ...game,
              favorite: !game.favorite,
            }
          : game,
      ),
    );
  };

  const toggleWishlistGame = (id: string) => {
    setGames((prev) =>
      prev.map((game) =>
        game.id === id
          ? {
              ...game,
              wishlist: !game.wishlist,
            }
          : game,
      ),
    );
  };

  const markPlayed = (id: string) => {
    updateGame(id, { lastPlayedAt: new Date().toISOString(), status: "playing" });
  };

  const setSearchTerm = (value: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: value }));
  };

  const setPlatformTerm = (value: string) => {
    setFilters((prev) => ({ ...prev, platformTerm: value }));
  };

  const setStatusFilter = (value: GameFilters["status"]) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const setPlatformFilter = (value: GameFilters["platformId"]) => {
    setFilters((prev) => ({ ...prev, platformId: value }));
  };

  const setFormatFilter = (value: GameFilters["format"]) => {
    setFilters((prev) => ({ ...prev, format: value }));
  };

  const toggleFavoritesOnly = () => {
    setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }));
  };

  const toggleWishlistOnly = () => {
    setFilters((prev) => ({ ...prev, wishlistOnly: !prev.wishlistOnly }));
  };

  const setSortOrder = (value: GameSortOrder) => {
    setFilters((prev) => ({ ...prev, sortOrder: value }));
  };

  const getGameById = (id: string) => games.find((game) => game.id === id);

  const clearDraftGame = () => setDraftGame(null);

  const value = useMemo(
    () => ({
      games,
      addGame,
      updateGame,
      deleteGame,
      setStatus,
      toggleFavoriteGame,
      toggleWishlistGame,
      markPlayed,
      replaceGames,
      filters,
      setSearchTerm,
      setPlatformTerm,
      setStatusFilter,
      setPlatformFilter,
      setFormatFilter,
      toggleFavoritesOnly,
      toggleWishlistOnly,
      setSortOrder,
      getGameById,
      draftGame,
      setDraftGame,
      clearDraftGame,
    }),
    [games, filters, draftGame],
  );

  return <GameStoreContext.Provider value={value}>{children}</GameStoreContext.Provider>;
}

export function useGameStore() {
  const context = useContext(GameStoreContext);
  if (!context) {
    throw new Error("useGameStore must be used within a GameProvider");
  }
  return context;
}

export function useCycleGameStatus(id: string) {
  const { games, setStatus } = useGameStore();
  const game = games.find((item) => item.id === id);
  if (!game) return () => undefined;
  return () => {
    const nextStatus = cycleStatus(game.status);
    setStatus(id, nextStatus);
  };
}
