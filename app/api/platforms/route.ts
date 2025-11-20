import { NextResponse } from "next/server";

import { getIgdbToken } from "@/lib/igdb";

export async function GET() {
  try {
    const { accessToken, clientId } = await getIgdbToken();
    const body = [
      "fields id, name, abbreviation;",
      "sort name asc;",
      "limit 200;",
    ].join("\n");

    const igdbRes = await fetch("https://api.igdb.com/v4/platforms", {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body,
    });

    if (!igdbRes.ok) {
      const text = await igdbRes.text().catch(() => "");
      console.error("IGDB platform lookup failed", igdbRes.status, text);
      return NextResponse.json({ error: "IGDB platform lookup failed", platforms: [] }, { status: 200 });
    }

    const platforms = (await igdbRes.json().catch(() => [])) as unknown[];

    return NextResponse.json({ platforms }, { status: 200 });
  } catch (error) {
    console.error("Platform route fatal error", error);
    return NextResponse.json({ error: "IGDB platform lookup failed", platforms: [] }, { status: 200 });
  }
}
