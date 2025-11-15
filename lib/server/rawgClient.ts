function resolveRawgBaseUrl(): string {
  const configured = process.env.RAWG_BASE_URL?.trim();
  const fallback = "https://api.rawg.io/api";

  if (!configured) {
    return fallback;
  }

  try {
    const url = new URL(configured);
    const pathname = url.pathname?.replace(/\/+$/, "") ?? "";

    if (!pathname || pathname === "/") {
      url.pathname = "/api";
    } else if (!/\bapi\b/.test(pathname.split("/").filter(Boolean).join("/"))) {
      url.pathname = `${pathname}/api`.replace(/\/+/, "/");
    }

    return url.toString();
  } catch (error) {
    console.warn(
      "Invalid RAWG_BASE_URL provided. Falling back to default https://api.rawg.io/api.",
      error,
    );
    return fallback;
  }
}

const RAWG_BASE_URL = resolveRawgBaseUrl();

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
