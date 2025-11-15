import { Game, GameStatus } from "./types";

export function cn(...inputs: Array<string | undefined | false | null>) {
  return inputs.filter(Boolean).join(" ");
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function getStatusColor(status: GameStatus) {
  switch (status) {
    case "playing":
      return "bg-blue-500/20 text-blue-300 border border-blue-500/40";
    case "completed":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
    case "dropped":
      return "bg-rose-500/20 text-rose-300 border border-rose-500/40";
    default:
      return "bg-slate-600/30 text-slate-200 border border-slate-500/40";
  }
}

export function cycleStatus(status: GameStatus): GameStatus {
  const order: GameStatus[] = ["backlog", "playing", "completed", "dropped"];
  const index = order.indexOf(status);
  const nextIndex = (index + 1) % order.length;
  return order[nextIndex];
}

export function sortGames(games: Game[], sortBy: string): Game[] {
  const copy = [...games];
  switch (sortBy) {
    case "title-desc":
      return copy.sort((a, b) => b.title.localeCompare(a.title));
    case "rating-desc":
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "rating-asc":
      return copy.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
    case "last-played":
      return copy.sort((a, b) => {
        const aTime = a.lastPlayedAt ? new Date(a.lastPlayedAt).getTime() : 0;
        const bTime = b.lastPlayedAt ? new Date(b.lastPlayedAt).getTime() : 0;
        return bTime - aTime;
      });
    case "title-asc":
    default:
      return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
}

export function parseTags(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.toLowerCase());
}

export function normalizeFilename(filename: string) {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/\s+/g, " ")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractRegion(filename: string): string | undefined {
  const match = filename.match(/\(([^)]+)\)/);
  if (match) {
    const region = match[1];
    if (/usa|us|ntsc/i.test(region)) return "USA";
    if (/jpn|japan/i.test(region)) return "JPN";
    if (/eur|europe|pal/i.test(region)) return "EUR";
    if (/world/i.test(region)) return "World";
    return region;
  }
  return undefined;
}

export function extractPlatformFromFilename(filename: string): string | undefined {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "gba":
      return "Game Boy Advance";
    case "gbc":
      return "Game Boy Color";
    case "gb":
      return "Game Boy";
    case "nds":
    case "dsi":
      return "Nintendo DS";
    case "3ds":
      return "Nintendo 3DS";
    case "nes":
      return "NES";
    case "sfc":
    case "smc":
    case "snes":
      return "Super Nintendo";
    case "n64":
      return "Nintendo 64";
    case "gcn":
    case "iso":
    case "wbfs":
      return "Nintendo GameCube";
    case "cia":
      return "Nintendo 3DS";
    case "z64":
      return "Nintendo 64";
    case "bin":
    case "cue":
      return "PlayStation";
    case "chd":
      return "Arcade";
    case "zip":
      return "Arcade";
    default:
      return undefined;
  }
}

export function humanizePlatform(platform?: string): string | undefined {
  if (!platform) return undefined;
  return platform
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
