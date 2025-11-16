import { NextRequest, NextResponse } from "next/server";

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: string | null = null;
let cachedTokenExpiresAt = 0;

async function getTwitchAccessToken(): Promise<string> {
  const twitchClientId = process.env.TWITCH_CLIENT_ID;
  const twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!twitchClientId || !twitchClientSecret) {
    console.error("Twitch token error", "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET");
    throw new Error("Missing Twitch credentials");
  }

  if (cachedToken && cachedTokenExpiresAt > Date.now() + 60_000) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.set("client_id", twitchClientId);
  params.set("client_secret", twitchClientSecret);
  params.set("grant_type", "client_credentials");

  const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!tokenResponse.ok) {
    const bodyText = await tokenResponse.text();
    console.error("Twitch token error", tokenResponse.status, bodyText);
    throw new Error("Failed to obtain Twitch access token");
  }

  const tokenData = (await tokenResponse.json()) as TwitchTokenResponse;
  if (!tokenData.access_token || typeof tokenData.expires_in !== "number") {
    console.error("Twitch token error", tokenData);
    throw new Error("Invalid Twitch token response");
  }

  cachedToken = tokenData.access_token;
  cachedTokenExpiresAt = Date.now() + tokenData.expires_in * 1000;

  return cachedToken;
}

export async function GET(_req: NextRequest) {
  try {
    const twitchClientId = process.env.TWITCH_CLIENT_ID;
    if (!twitchClientId) {
      console.error("Missing TWITCH_CLIENT_ID env var");
      return NextResponse.json(
        { error: "Missing TWITCH_CLIENT_ID env var" },
        { status: 500 },
      );
    }

    const accessToken = await getTwitchAccessToken();
    const igdbBaseUrl = (process.env.IGDB_BASE_URL ?? "https://api.igdb.com/v4").replace(/\/$/, "");
    const query = [
      "fields id,name,slug,abbreviation,generation,platform_logo.image_id;",
      "sort name asc;",
      "limit 200;",
    ].join("\n");

    const response = await fetch(`${igdbBaseUrl}/platforms`, {
      method: "POST",
      headers: {
        "Client-ID": twitchClientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: query,
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.error("IGDB platform error", response.status, bodyText);
      return NextResponse.json(
        { error: "IGDB platform lookup failed", status: response.status },
        { status: 500 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Platform route fatal error", error);
    const message = error instanceof Error ? error.message : "Unable to load platforms";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
