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
    const error = new Error("Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET");
    console.error("Twitch token error", error);
    throw error;
  }

  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt && now < cachedTokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
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
    const bodyText = await tokenRes.text();
    console.error("Twitch token error", tokenRes.status, bodyText);
    throw new Error("Failed to obtain Twitch access token");
  }

  const tokenData = (await tokenRes.json()) as TwitchTokenResponse;
  if (!tokenData.access_token || typeof tokenData.expires_in !== "number") {
    console.error("Twitch token error", tokenData);
    throw new Error("Invalid Twitch token response");
  }

  cachedToken = tokenData.access_token;
  const expiresInMs = Math.max(tokenData.expires_in - 60, 0) * 1000;
  cachedTokenExpiresAt = now + expiresInMs;

  return cachedToken;
}

export async function GET(_req: NextRequest) {
  try {
    const [accessToken, clientId] = await Promise.all([
      getTwitchAccessToken(),
      Promise.resolve(process.env.TWITCH_CLIENT_ID ?? null),
    ]);

    if (!clientId) {
      console.error("Missing TWITCH_CLIENT_ID env var for IGDB request");
      return NextResponse.json({ error: "Missing TWITCH_CLIENT_ID" }, { status: 500 });
    }

    const baseUrl = (process.env.IGDB_BASE_URL ?? "https://api.igdb.com/v4").replace(/\/$/, "");
    const query = [
      "fields id,name,slug,abbreviation;",
      "sort name asc;",
      "limit 100;",
    ].join("\n");

    const res = await fetch(`${baseUrl}/platforms`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: query,
    });

    if (!res.ok) {
      console.error("IGDB platform error", res.status, await res.text());
      return NextResponse.json(
        { error: "IGDB platform lookup failed", status: res.status },
        { status: 500 },
      );
    }

    const data = (await res.json()) as unknown;
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("IGDB platforms handler error", error);
    const message = error instanceof Error ? error.message : "Unable to load platforms";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
