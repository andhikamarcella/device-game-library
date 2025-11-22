import { NextResponse } from "next/server";
import { igdbPost } from "@/lib/igdbClient";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60;
    const body = [
      "fields id,name,slug,first_release_date,cover.image_id,aggregated_rating,rating,rating_count,platforms.name,platforms.slug;",
      `where first_release_date != null & first_release_date < ${now} & first_release_date > ${ninetyDaysAgo};`,
      "sort first_release_date desc;",
      "limit 20;",
    ].join("\n");
    const data = await igdbPost("games", body);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
