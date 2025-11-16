import { NextRequest, NextResponse } from "next/server";
import { getTwitchAccessToken } from "@/lib/twitchAuth";

const IGDB_BASE_URL = process.env.IGDB_BASE_URL || "https://api.igdb.com/v4";

export async function GET(_req: NextRequest) {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) {
      console.error("Missing TWITCH_CLIENT_ID env var");
      return NextResponse.json(
        { error: "Missing TWITCH_CLIENT_ID env var" },
        { status: 500 },
      );
    }

    const accessToken = await getTwitchAccessToken();

    const query = [
      "fields id,name,abbreviation,generation,platform_logo.image_id;",
      "sort name asc;",
      "limit 200;",
    ].join("\n");

    const res = await fetch(`${IGDB_BASE_URL}/platforms`, {
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
      console.error("IGDB platform error", res.status, text);
      return NextResponse.json(
        {
          error: "IGDB platform lookup failed",
          status: res.status,
          details: text,
        },
        { status: 500 },
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Platform route fatal error", error);
    return NextResponse.json(
      { error: "Unexpected server error while loading platforms" },
      { status: 500 },
    );
  }
}
