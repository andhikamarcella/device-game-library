import { NextResponse } from "next/server";

import { IgdbRequestError, igdbFetch } from "@/lib/igdb";

const PLATFORM_CACHE_TTL = 1000 * 60 * 60; // 1 hour

type PlatformCache = { platforms: any[]; timestamp: number };

let cachedPlatforms: PlatformCache | null = null;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (cachedPlatforms && Date.now() - cachedPlatforms.timestamp < PLATFORM_CACHE_TTL) {
      return NextResponse.json({ platforms: cachedPlatforms.platforms, cached: true });
    }

    const body = `
      fields id, name, abbreviation, generation;
      sort name asc;
      limit 500;
    `;

    const platforms = await igdbFetch<any[]>("platforms", body);

    cachedPlatforms = { platforms, timestamp: Date.now() };

    return NextResponse.json({ platforms });
  } catch (error) {
    if (error instanceof IgdbRequestError && error.status === 429 && cachedPlatforms) {
      console.warn("IGDB platform lookup rate limited, serving cached platforms");
      return NextResponse.json({ platforms: cachedPlatforms.platforms, cached: true });
    }

    console.error("IGDB platform lookup error", error);
    return NextResponse.json({ error: "IGDB platform lookup failed" }, { status: 500 });
  }
}
