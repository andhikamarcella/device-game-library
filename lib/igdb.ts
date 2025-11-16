export interface IgdbToken {
  accessToken: string;
  expiresAt: number;
}

export interface IgdbCover {
  id: number;
  image_id: string;
}

export interface IgdbGame {
  id: number;
  name: string;
  cover?: IgdbCover;
}

let cachedToken: IgdbToken | null = null;

const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

export function buildIgdbImageUrl(
  imageId: string,
  size: "cover_big" | "cover_small" | "screenshot_big" = "cover_big",
): string {
  return `https://images.igdb.com/igdb/image/upload/t-${size}/${imageId}.jpg`;
}

export async function getIgdbToken(): Promise<IgdbToken> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken;
  }

  const clientId = getEnvOrThrow("TWITCH_CLIENT_ID");
  const clientSecret = getEnvOrThrow("TWITCH_CLIENT_SECRET");

  const tokenUrl = new URL("https://id.twitch.tv/oauth2/token");
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const response = await fetch(tokenUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to retrieve Twitch token (${response.status})`);
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!data.access_token || typeof data.expires_in !== "number") {
    throw new Error("Invalid Twitch token response");
  }

  const expiresAt = now + Math.max(data.expires_in - 60, 60) * 1000;
  cachedToken = { accessToken: data.access_token, expiresAt };
  return cachedToken;
}

const sanitizeSearchTerm = (term: string): string => term.replace(/"/g, '\\"');

export async function searchIgdbGameCoverByName(name: string): Promise<string | null> {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  try {
    const token = await getIgdbToken();
    const clientId = getEnvOrThrow("TWITCH_CLIENT_ID");
    const baseUrl = getEnvOrThrow("IGDB_BASE_URL");
    const url = new URL("/games", baseUrl);
    const sanitizedName = sanitizeSearchTerm(trimmed);
    const query = `search "${sanitizedName}";\nfields id,name,cover.image_id;\nlimit 1;`;

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token.accessToken}`,
        "Content-Type": "text/plain",
      },
      body: query,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("IGDB games lookup failed", response.status, await response.text());
      return null;
    }

    const data = (await response.json()) as IgdbGame[];
    const imageId = data?.[0]?.cover?.image_id;
    if (imageId) {
      return buildIgdbImageUrl(imageId, "cover_big");
    }
  } catch (error) {
    console.error("IGDB cover lookup error", error);
  }

  return null;
}
