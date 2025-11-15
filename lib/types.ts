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

