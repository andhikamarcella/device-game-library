import { NextResponse } from "next/server";
import { getGameVideos } from "@/lib/gameData";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "A valid IGDB id is required." }, { status: 400 });
  }

  try {
    const data = await getGameVideos(id);
    return NextResponse.json({ results: data });
  } catch (error) {
    console.error("IGDB movies error", error);
    const message = error instanceof Error ? error.message : "Unable to load IGDB videos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
