export type GameStatus = "backlog" | "playing" | "completed" | "dropped";
export type GameFormat = "rom" | "cartridge" | "disc" | "digital";

export type Device = {
  id: string;
  name: string;
  type: string;
  manufacturer?: string;
  notes?: string;
  favorite?: boolean;
  createdAt: string;
};

export type Game = {
  id: string;
  title: string;
  platformId: string;
  platformName: string;
  rawgId?: number;
  region?: string;
  status: GameStatus;
  format: GameFormat;
  source?: string;
  fileName?: string;
  folderPath?: string;
  emulatorCore?: string;
  shaderPreset?: string;
  tags: string[];
  rating?: number;
  hoursPlayed?: number;
  lastPlayedAt?: string;
  notes?: string;
  favorite?: boolean;
  wishlist?: boolean;
  coverImage?: string;
  heroImage?: string;
  screenshotUrls?: string[];
  createdAt: string;
};

export type Settings = {
  theme: "light" | "dark" | "system";
  lastBackupAt?: string;
  reduceMotion?: boolean;
  highContrast?: boolean;
  largeText?: boolean;
};

export type Ownership =
  | "none"
  | "wishlist"
  | "owned_digital"
  | "owned_physical"
  | "emulator_only";

export type PlayStatus =
  | "not_started"
  | "playing"
  | "beaten"
  | "completed"
  | "dropped";

export interface UserGameEntry {
  rawgId: number;
  slug: string;
  title: string;
  coverImage?: string | null;
  platforms: string[];
  ownership: Ownership;
  status: PlayStatus;
  personalRating?: number | null;
  playtimeHours?: number;
  lastPlayedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  releaseYear?: number | null;
  rawgRating?: number | null;
  rawgRatingsCount?: number | null;
  rawgPlaytime?: number | null;
  metacritic?: number | null;
  genres?: string[];
  boxArtSource?: "rawg" | "tgdb";
}

export type LibraryStats = {
  totalGames: number;
  totalCompleted: number;
  totalPlaying: number;
  totalWishlist: number;
  totalPlaytime: number;
  mostCommonPlatform: string | null;
  topGenres: Array<{ genre: string; count: number }>;
};

export type VideoSource =
  | {
      type: "rawg";
      url: string;
      preview?: string | null;
      title?: string;
    }
  | {
      type: "youtube";
      url: string;
      preview?: string | null;
      title?: string;
    };

