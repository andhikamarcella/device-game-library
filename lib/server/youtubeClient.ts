const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";

function buildYoutubeUrl(path: string): URL {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return new URL(path);
  }

  const base = YOUTUBE_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return new URL(`${base}/${normalizedPath}`);
}

function getYoutubeApiKey(): string {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY environment variable is not configured.");
  }
  return apiKey;
}

export async function fetchFromYoutube<T>(
  path: string,
  params?: Record<string, string | number | undefined | null>,
): Promise<T> {
  const url = buildYoutubeUrl(path);
  url.searchParams.set("key", getYoutubeApiKey());
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    cache: "force-cache",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      (body && (body.error?.message || body.error?.errors?.[0]?.message)) ||
      `YouTube request failed with status ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}
