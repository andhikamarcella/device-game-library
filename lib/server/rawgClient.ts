const RAWG_BASE_URL = process.env.RAWG_BASE_URL ?? "https://api.rawg.io/api";

function buildRawgUrl(path: string): URL {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return new URL(path);
  }

  const base = RAWG_BASE_URL.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return new URL(`${base}/${normalizedPath}`);
}

function getRawgApiKey(): string {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    throw new Error("RAWG_API_KEY environment variable is not configured.");
  }
  return apiKey;
}

export async function fetchFromRawg<T>(
  path: string,
  params?: Record<string, string | number | undefined | null>,
  init?: RequestInit,
): Promise<T> {
  const url = buildRawgUrl(path);

  url.searchParams.set("key", getRawgApiKey());

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
    ...init,
    next: init?.next ?? { revalidate: 60 },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      (body && (body.detail || body.error || body.message)) ||
      `RAWG request failed with status ${response.status}`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}
