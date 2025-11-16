import { NextRequest, NextResponse } from "next/server";

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

const twitchClientId = process.env.TWITCH_CLIENT_ID;
const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;

if (!twitchClientId || !twitchClientSecret) {
  throw new Error("Missing Twitch env variables");
}

let cachedToken: string | null = null;
let cachedExpiresAt: number | null = null;

async function getTwitchAccessToken(): Promise<string> {
  if (cachedToken && cachedExpiresAt && cachedExpiresAt > Date.now() + 60_000) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    client_id: twitchClientId,
    client_secret: twitchClientSecret,
    grant_type: "client_credentials",
  });

  const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!tokenRes.ok) {
    console.error("Twitch token error:", tokenRes.status, await tokenRes.text());
    throw new Error("Failed to acquire Twitch token");
  }

  const tokenData = (await tokenRes.json()) as TwitchTokenResponse;
  cachedToken = tokenData.access_token;
  cachedExpiresAt = Date.now() + (tokenData.expires_in - 60) * 1000;

  return cachedToken;
}

function escapeQuery(value: string): string {
  return value.replace(/"/g, '\\"');
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter `q` is required" },
      { status: 400 },
    );
  }

  const accessToken = await getTwitchAccessToken();
  const igdbQuery = `search "${escapeQuery(query)}";\nfields id,name,slug,summary,cover.image_id,platforms.name;\nlimit 20;`;

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": twitchClientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: igdbQuery,
  });

  if (!res.ok) {
    console.error("IGDB search error:", res.status, await res.text());
    return NextResponse.json(
      { error: "IGDB search failed", status: res.status },
      { status: 500 },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
