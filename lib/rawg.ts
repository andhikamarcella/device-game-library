const RAWG_BASE_URL = "https://api.rawg.io/api";

export type RawgAchievement = {
  id: number;
  name: string;
  description?: string | null;
  image?: string | null;
  percent?: number | null;
  ordering?: number | null;
};

export async function fetchRawgAchievements(rawgId: number | string): Promise<RawgAchievement[]> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.error("Missing RAWG_API_KEY env");
    throw new Error("RAWG_API_KEY not configured");
  }

  const url = `${RAWG_BASE_URL}/games/${rawgId}/achievements?key=${apiKey}&page=1&page_size=40`;

  const res = await fetch(url, { next: { revalidate: 60 * 10 } });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("RAWG achievements failed", res.status, text);
    throw new Error(`RAWG achievements error: ${res.status}`);
  }

  const data = await res.json();
  const results = Array.isArray((data as any)?.results) ? (data as any).results : [];

  return results.map((item: any): RawgAchievement => ({
    id: item.id,
    name: item.name,
    description: item.description ?? item.description_text ?? null,
    image: item.image ?? item.image_background ?? null,
    percent: item.percent ?? item.percent_unlocked ?? null,
    ordering: item.ordering ?? null,
  }));
}

export { RAWG_BASE_URL };
