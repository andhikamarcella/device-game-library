import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

let cachedToken: string | null = null;
let cachedTokenExpiresAt = 0;

async function getTwitchAccessToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing Twitch credentials", { hasClientId: !!clientId, hasClientSecret: !!clientSecret });
    throw new Error("Missing Twitch credentials");
  }

  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt > now + 60_000) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  params.set("grant_type", "client_credentials");

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Twitch token error", response.status, text);
    throw new Error(`Failed to fetch Twitch token: ${response.status}`);
  }

  const data = (await response.json()) as TwitchTokenResponse;
  if (!data.access_token) {
    console.error("Twitch token response missing access_token", data);
    throw new Error("Invalid Twitch token response");
  }

  cachedToken = data.access_token;
  cachedTokenExpiresAt = now + data.expires_in * 1000;
  return cachedToken;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const platformId = url.searchParams.get("platformId")?.trim() || null;
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  const igdbBaseUrl = process.env.IGDB_BASE_URL;
  const twitchClientId = process.env.TWITCH_CLIENT_ID;

  if (!igdbBaseUrl || !twitchClientId) {
    console.error("Missing IGDB/Twitch env vars", { igdbBaseUrl, twitchClientId });
    return NextResponse.json({ error: "Server IGDB configuration error" }, { status: 500 });
  }

  const accessToken = await getTwitchAccessToken();

  const limit = Math.min(parseInt(limitParam || "20", 10) || 20, 50);
  const offset = parseInt(offsetParam || "0", 10) || 0;
  const escapedQ = q.replace(/"/g, '\\"');

  const queryParts: string[] = [];
  if (escapedQ.length > 0) {
    queryParts.push(`search "${escapedQ}";`);
  }

  if (platformId) {
    queryParts.push(`where platforms = (${platformId});`);
  }

  queryParts.push(
    "fields id,name,slug,first_release_date,summary,cover.image_id,platforms.id,platforms.name;",
    `limit ${limit};`,
    `offset ${offset};`,
  );

  const igdbQuery = queryParts.join("\n");

  const response = await fetch(`${igdbBaseUrl}/games`, {
    method: "POST",
    headers: {
      "Client-ID": twitchClientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: igdbQuery,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("IGDB search error", {
      status: response.status,
      statusText: response.statusText,
      body: text,
    });

    return NextResponse.json(
      {
        error: "IGDB search failed",
        status: response.status,
        statusText: response.statusText,
        details: text,
      },
      {
        status:
          response.status === 400 || response.status === 404 || response.status === 403
            ? response.status
            : 500,
      },
    );
  }

  const data = await response.json();
  return NextResponse.json(data, { status: 200 });
}
