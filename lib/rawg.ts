const RAWG_BASE_URL = "https://api.rawg.io/api";

export type RawgAchievement = {
  id: number;
  name: string;
  description?: string | null;
  image?: string | null;
  percent?: number | null;
  ordering?: number | null;
};

export type RawgReview = {
  id: number;
  text: string | null;
  rating: number | null;
  created: string | null;
  likes_count: number | null;
  comments_count: number | null;
  positive: boolean | null;
  negative: boolean | null;
  user: {
    username: string | null;
    avatar: string | null;
  };
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

export async function fetchRawgReviews(slug: string): Promise<RawgReview[]> {
  if (!slug) {
    return [];
  }

  const apiKey = process.env.RAWG_API_KEY;

  if (!apiKey) {
    console.error("Missing RAWG_API_KEY env");
    return [];
  }

  const url = `${RAWG_BASE_URL}/games/${slug}/reviews?key=${apiKey}`;

  const res = await fetch(url, { next: { revalidate: 60 * 10 } });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("RAWG reviews failed", res.status, text);
    return [];
  }

  const data = await res.json().catch(() => ({ results: [] }));
  const results = Array.isArray((data as any)?.results) ? (data as any).results : [];

  return results.map(
    (item: any): RawgReview => ({
      id: typeof item.id === "number" ? item.id : 0,
      text: item.text ?? item.text_raw ?? null,
      rating:
        typeof item.rating === "number"
          ? item.rating
          : typeof item.rating === "string"
            ? Number.parseFloat(item.rating)
            : null,
      created: item.created ?? item.created_at ?? null,
      likes_count: typeof item.likes_count === "number" ? item.likes_count : null,
      comments_count: typeof item.comments_count === "number" ? item.comments_count : null,
      positive: typeof item.positive === "boolean" ? item.positive : null,
      negative: typeof item.negative === "boolean" ? item.negative : null,
      user: {
        username: item.user?.username ?? null,
        avatar: item.user?.avatar ?? item.user?.avatar_url ?? null,
      },
    }),
  );
}

export { RAWG_BASE_URL };
