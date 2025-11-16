import { NextResponse } from "next/server";
import { normalizeRawgImageUrl } from "@/lib/images";
import { fetchFromRawg } from "@/lib/server/rawgClient";

type RawgScreenshot = {
  id: number;
  image: string;
  width?: number;
  height?: number;
};

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "A valid RAWG id is required." }, { status: 400 });
  }

  try {
    const data = await fetchFromRawg<{ results: RawgScreenshot[] }>(`/games/${id}/screenshots`, {
      page_size: 12,
    });
    return NextResponse.json({
      results:
        data.results?.map((item) => ({
          ...item,
          image: normalizeRawgImageUrl(item.image),
        })) ?? [],
    });
  } catch (error) {
    console.error("RAWG screenshots error", error);
    const message = error instanceof Error ? error.message : "Unable to load RAWG screenshots.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
