import { NextRequest, NextResponse } from "next/server";

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: string | null = null;
let cachedExpiresAt: number | null = null;

async function getTwitchAccessToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing Twitch env variables");
    throw new Error("Missing Twitch env variables");
  }

  if (cachedToken && cachedExpiresAt && cachedExpiresAt > Date.now() + 60_000) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("grant_type", "client_credentials");

  const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
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

  const twitchClientId = process.env.TWITCH_CLIENT_ID;

  if (!twitchClientId) {
    console.error("Missing TWITCH_CLIENT_ID env variable");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const accessToken = await getTwitchAccessToken();
  const igdbQuery =
    `search "${escapeQuery(query)}";\n` +
    "fields id,name,slug,first_release_date,summary,cover.image_id,platforms.name;\n" +
    "limit 20;";

  const igdbBaseUrl = (process.env.IGDB_BASE_URL ?? "https://api.igdb.com/v4").replace(/\/$/, "");

  const res = await fetch(`${igdbBaseUrl}/games`, {
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
