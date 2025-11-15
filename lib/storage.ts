import { Device, Game, Settings } from "./types";

const DEVICE_KEY = "dglt_devices";
const GAME_KEY = "dglt_games";
const SETTINGS_KEY = "dglt_settings";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("Failed to parse localStorage value", error);
    return fallback;
  }
}

export function loadDevices(): Device[] {
  if (!isBrowser()) return [];
  return safeParse<Device[]>(localStorage.getItem(DEVICE_KEY), []);
}

export function saveDevices(devices: Device[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(DEVICE_KEY, JSON.stringify(devices));
}

export function loadGames(): Game[] {
  if (!isBrowser()) return [];
  return safeParse<Game[]>(localStorage.getItem(GAME_KEY), []);
}

export function saveGames(games: Game[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(GAME_KEY, JSON.stringify(games));
}

export function loadSettings(): Settings {
  if (!isBrowser()) return { theme: "dark" };
  return safeParse<Settings>(localStorage.getItem(SETTINGS_KEY), { theme: "dark" });
}

export function saveSettings(settings: Settings): void {
  if (!isBrowser()) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function resetDevices(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(DEVICE_KEY);
}

export function resetGames(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(GAME_KEY);
}

export function resetAll(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(DEVICE_KEY);
  localStorage.removeItem(GAME_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
