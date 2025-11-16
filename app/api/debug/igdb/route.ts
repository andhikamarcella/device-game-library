import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const igdbBaseUrl = process.env.IGDB_BASE_URL ?? "https://api.igdb.com/v4";

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET" },
      { status: 500 },
    );
  }

  try {
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      return NextResponse.json(
        { error: "Failed to get Twitch token", status: tokenRes.status, body: tokenData },
        { status: 500 },
      );
    }

    const query = `
  fields id, name, first_release_date, platforms.name;
  limit 5;
  sort first_release_date desc;
`;

    const igdbRes = await fetch(`${igdbBaseUrl}/games`, {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "text/plain",
        Accept: "application/json",
      },
      body: query,
    });

    const text = await igdbRes.text();

    return NextResponse.json({
      tokenStatus: tokenRes.status,
      igdbStatus: igdbRes.status,
      igdbBody: text,
    });
  } catch (error) {
    console.error("IGDB debug route error", error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
