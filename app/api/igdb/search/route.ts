import { NextRequest, NextResponse } from "next/server";

import { igdbPost } from "@/lib/igdbClient";
import { igdbFetch } from "@/lib/igdb";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json({ error: "Query parameter `q` is required" }, { status: 400 });
    }

    const escaped = q.replace(/"/g, '\\"');

    const body = [
      `search "${escaped}";`,
      "fields id,name,slug,first_release_date,summary,cover.image_id,platforms.name;",
      "limit 20;",
    ].join("\n");

    const data = await igdbFetch("games", body);

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("IGDB search fatal error", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json().catch(() => ({ query: "" }))) as { query?: string };
    if (!query) {
      return NextResponse.json({ error: "`query` body is required" }, { status: 400 });
    }
    const data = await igdbPost("games", query);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
