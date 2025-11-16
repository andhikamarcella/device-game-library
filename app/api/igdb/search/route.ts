import { NextRequest, NextResponse } from "next/server";
import { getTwitchAccessToken } from "@/lib/twitchAuth";

const IGDB_BASE_URL = process.env.IGDB_BASE_URL || "https://api.igdb.com/v4";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q) {
      return NextResponse.json(
        { error: "Query parameter `q` is required" },
        { status: 400 },
      );
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) {
      console.error("Missing TWITCH_CLIENT_ID env var");
      return NextResponse.json(
        { error: "Missing TWITCH_CLIENT_ID env var" },
        { status: 500 },
      );
    }

    const accessToken = await getTwitchAccessToken();

    const escaped = q.replace(/"/g, '\\"');

    const query = [
      `search "${escaped}";`,
      "fields id,name,slug,first_release_date,summary,cover.image_id,platforms.name;",
      "limit 20;",
    ].join("\n");

    const res = await fetch(`${IGDB_BASE_URL}/games`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
        Accept: "application/json",
      },
      body: query,
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("IGDB search error", res.status, text);
      return NextResponse.json(
        {
          error: "IGDB search failed",
          status: res.status,
          details: text,
        },
        { status: 500 },
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("IGDB search fatal error", error);
    return NextResponse.json(
      { error: "Unexpected server error while searching IGDB" },
      { status: 500 },
    );
  }
}
