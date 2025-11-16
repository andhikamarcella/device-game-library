import { NextRequest, NextResponse } from "next/server";

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: string | null = null;
let cachedTokenExpiresAt: number | null = null;

async function getTwitchAccessToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Missing Twitch env variables");
    throw new Error("Missing Twitch env variables");
  }

  if (cachedToken && cachedTokenExpiresAt && cachedTokenExpiresAt > Date.now() + 60_000) {
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
    console.error("Twitch token error", tokenRes.status, await tokenRes.text());
    throw new Error("Failed to acquire Twitch token");
  }

  const tokenData = (await tokenRes.json()) as TwitchTokenResponse;
  cachedToken = tokenData.access_token;
  cachedTokenExpiresAt = Date.now() + (tokenData.expires_in - 60) * 1000;

  return cachedToken;
}

export async function GET(req: NextRequest) {
  void req;
  const twitchClientId = process.env.TWITCH_CLIENT_ID;

  if (!twitchClientId) {
    console.error("Missing TWITCH_CLIENT_ID env variable");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const accessToken = await getTwitchAccessToken();
  const igdbBaseUrl = process.env.IGDB_BASE_URL ?? "https://api.igdb.com/v4";
  const platformQuery =
    "fields id,name,slug,abbreviation,generation;\nsort name asc;\nlimit 500;";

  const res = await fetch(`${igdbBaseUrl}/platforms`, {
    method: "POST",
    headers: {
      "Client-ID": twitchClientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body: platformQuery,
  });

  if (!res.ok) {
    console.error("IGDB platform error", res.status, await res.text());
    return NextResponse.json(
      { error: "IGDB platform lookup failed", status: res.status },
      { status: 500 },
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: 200 });
}
