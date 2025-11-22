import { NextRequest, NextResponse } from "next/server";
import { igdbPost } from "@/lib/igdbClient";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const limit = Number((await req.json().catch(() => ({}))).limit ?? 100);
    const body = [
      "fields id,name,slug,aggregated_rating,rating_count,cover.image_id,platforms.name,first_release_date;",
      "where aggregated_rating > 80 & rating_count > 100;",
      "sort aggregated_rating desc;",
      `limit ${Number.isNaN(limit) ? 100 : Math.min(Math.max(limit, 1), 100)};`,
    ].join("\n");
    const data = await igdbPost("games", body);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
