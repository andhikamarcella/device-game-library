const TGDB_BASE = process.env.TGDB_BASE_URL ?? "https://api.thegamesdb.net/v1";
const TGDB_KEY = process.env.TGDB_API_KEY;

if (!TGDB_KEY) {
  console.warn("TGDB_API_KEY is not configured, TGDB fallback will be disabled");
}

function ensureConfigured() {
  if (!TGDB_KEY) {
    throw new Error("TGDB is not configured");
  }
}

async function tgdbFetch<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  ensureConfigured();
  const url = new URL(path, TGDB_BASE);
  url.searchParams.set("apikey", TGDB_KEY!);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TGDB error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export type TgdbImageBaseUrls = {
  original?: string;
  thumb?: string;
  small?: string;
  medium?: string;
};

export type TgdbGame = {
  id: number;
  game_title: string;
  release_date?: string;
  platforms?: number[];
  overview?: string;
  images?: {
    boxart?: { [side: string]: { filename: string }[] };
  };
};

export type TgdbSearchResponse = {
  data: {
    games?: TgdbGame[];
    base_url?: TgdbImageBaseUrls;
  };
};

export async function searchGamesTgdb(name: string, platformId?: number): Promise<TgdbSearchResponse> {
  return tgdbFetch<TgdbSearchResponse>("/Games/ByGameName", {
    name,
    filter: platformId ? `platform:${platformId}` : undefined,
  });
}

export function resolveTgdbBoxArt(game: TgdbGame, baseUrl?: TgdbImageBaseUrls): string | null {
  if (!game.images?.boxart || !baseUrl) return null;
  const variants = Object.values(game.images.boxart).flat();
  const chosen = variants.find((item) => item.filename) ?? null;
  if (!chosen) return null;
  const prefix = baseUrl.original ?? baseUrl.medium ?? baseUrl.small ?? baseUrl.thumb ?? "";
  if (!prefix) return null;
  return `${prefix}${chosen.filename}`;
}

