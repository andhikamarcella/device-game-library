import { NextResponse } from "next/server";
import { normalizeImageUrl } from "@/lib/images";
import { getGameScreenshots } from "@/lib/gameData";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "A valid IGDB id is required." }, { status: 400 });
  }

  try {
    const data = await getGameScreenshots(id, 1, 12);
    return NextResponse.json({
      results: data.map((item) => ({
        ...item,
        image: normalizeImageUrl(item.image),
      })),
    });
  } catch (error) {
    console.error("IGDB screenshots error", error);
    const message = error instanceof Error ? error.message : "Unable to load IGDB screenshots.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
