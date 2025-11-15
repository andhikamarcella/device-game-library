import { NextResponse } from "next/server";
import { searchPlatforms } from "@/lib/rawg";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  try {
    const platforms = await searchPlatforms(query);
    const results = platforms.map((platform) => ({
      id: platform.id,
      name: platform.name,
      slug: platform.slug,
      yearStart: platform.year_start,
      image: platform.image_background,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("RAWG platform error", error);
    const message = error instanceof Error ? error.message : "Unable to fetch platforms.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
