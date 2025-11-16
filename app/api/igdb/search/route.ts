import { NextRequest, NextResponse } from "next/server";
import { getTwitchAccessToken } from "@/lib/twitchAuth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const IGDB_BASE_URL = process.env.IGDB_BASE_URL ?? "https://api.igdb.com/v4";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json({ error: "Query parameter `q` is required" }, { status: 400 });
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "Missing TWITCH_CLIENT_ID" }, { status: 500 });
    }

    const accessToken = await getTwitchAccessToken();
    const escaped = q.replace(/"/g, '\\"');

    const query = [
      `search "${escaped}";`,
      "fields id,name,slug,first_release_date,summary,cover.image_id,platforms.name;",
      "limit 20;",
    ].join("\n");

    const response = await fetch(`${IGDB_BASE_URL}/games`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
        Accept: "application/json",
      },
      body: query,
    });

    const text = await response.text();

    if (!response.ok) {
      console.error("IGDB search failed", response.status, text);
      return NextResponse.json(
        {
          error: "IGDB search failed",
          status: response.status,
          details: text,
        },
        { status: 500 },
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("IGDB search fatal error", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
