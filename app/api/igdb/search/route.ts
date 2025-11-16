import { NextRequest, NextResponse } from "next/server";

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: string | null = null;
let cachedTokenExpiresAt = 0;

async function getTwitchAccessToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const error = new Error("Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET");
    console.error(error.message);
    throw error;
  }

  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt - 60_000 > now) {
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

  const tokenData = (await tokenRes.json()) as Partial<TwitchTokenResponse>;

  if (!tokenRes.ok || !tokenData.access_token || !tokenData.expires_in) {
    console.error("Failed to acquire Twitch token", {
      status: tokenRes.status,
      body: tokenData,
    });
    throw new Error("Failed to acquire Twitch token");
  }

  cachedToken = tokenData.access_token;
  cachedTokenExpiresAt = now + tokenData.expires_in * 1000;

  return cachedToken;
}

function escapeIgdbSearchTerm(term: string): string {
  return term.replace(/"/g, '\\"');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter `q` is required" },
      { status: 400 },
    );
  }

  try {
    const accessToken = await getTwitchAccessToken();
    const clientId = process.env.TWITCH_CLIENT_ID!;
    const igdbQuery = `search "${escapeIgdbSearchTerm(query)}"; fields id,name,slug,first_release_date,summary,cover.image_id,platforms.name; limit 20;`;

    const igdbRes = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: igdbQuery,
    });

    if (!igdbRes.ok) {
      const errorText = await igdbRes.text();
      console.error("IGDB search error", {
        status: igdbRes.status,
        body: errorText,
      });
      return NextResponse.json(
        { error: "IGDB search failed", status: igdbRes.status },
        { status: 500 },
      );
    }

    const data = await igdbRes.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("IGDB search handler error", error);
    const message = error instanceof Error ? error.message : "Failed to perform IGDB search";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
