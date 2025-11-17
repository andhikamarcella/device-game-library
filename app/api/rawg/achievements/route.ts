import { NextResponse } from "next/server";
import { fetchRawgAchievements } from "@/lib/rawg";

export async function POST(req: Request) {
  try {
    const { rawgId } = await req.json();

    if (!rawgId) {
      return NextResponse.json({ error: "rawgId is required" }, { status: 400 });
    }

    const achievements = await fetchRawgAchievements(rawgId);

    return NextResponse.json({ achievements }, { status: 200 });
  } catch (err) {
    console.error("RAWG achievements route error", err);
    return NextResponse.json(
      { error: "Failed to load achievements", achievements: [] },
      { status: 200 },
    );
  }
}
