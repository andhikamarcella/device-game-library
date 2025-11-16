import { NextRequest, NextResponse } from "next/server";

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value;
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
    next: { revalidate: 0 },
  });

  const tokenData = (await tokenRes.json()) as Partial<TwitchTokenResponse>;

  if (!tokenRes.ok || !tokenData.access_token || !tokenData.expires_in) {
    throw new Error(
      `Failed to acquire Twitch token (status ${tokenRes.status}): ${JSON.stringify(tokenData)}`,
    );
  }

  cachedToken = {
    value: tokenData.access_token,
    expiresAt: now + tokenData.expires_in * 1000,
  };

  return cachedToken.value;
}

function escapeIgdbSearchTerm(term: string): string {
  return term.replace(/"/g, '\\"');
}

export async function GET(request: NextRequest) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const igdbBaseUrl = process.env.IGDB_BASE_URL ?? "https://api.igdb.com/v4";

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Query parameter q is required" }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken(clientId, clientSecret);
    const escapedQuery = escapeIgdbSearchTerm(query);
    const body = `search "${escapedQuery}"; fields id, name, slug, first_release_date, platforms.name; limit 20;`;

    const igdbResponse = await fetch(`${igdbBaseUrl}/games`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
        Accept: "application/json",
      },
      body,
      next: { revalidate: 0 },
    });

    const data = await igdbResponse.json();

    if (!igdbResponse.ok) {
      return NextResponse.json(
        { error: "IGDB request failed", status: igdbResponse.status, body: data },
        { status: igdbResponse.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("IGDB search error", error);
    const message = error instanceof Error ? error.message : "Failed to query IGDB";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
