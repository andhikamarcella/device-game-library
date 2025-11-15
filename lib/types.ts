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
  createdAt: string;
};

export type Settings = {
  theme: "light" | "dark" | "system";
  lastBackupAt?: string;
};

export type MetadataResult = {
  title: string;
  normalizedTitle: string;
  platform?: string;
  platformId?: string;
  platformShortName?: string;
  region?: string;
  releaseDate?: string;
  publisher?: string;
  developer?: string;
  genre?: string;
  synopsis?: string;
  tags?: string[];
  media?: {
    cover?: string;
    screenshots?: string[];
    logo?: string;
    box?: string;
  };
  hashes?: {
    crc?: string;
    md5?: string;
    sha1?: string;
  };
  rom?: {
    fileName?: string;
    fileExtension?: string;
  };
};
