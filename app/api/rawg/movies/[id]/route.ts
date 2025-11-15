import { NextResponse } from "next/server";
import { fetchFromRawg } from "@/lib/server/rawgClient";

type RawgMovie = {
  id: number;
  name: string;
  preview: string | null;
  data: {
    480?: string;
    max?: string;
  };
};

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "A valid RAWG id is required." }, { status: 400 });
  }

  try {
    const data = await fetchFromRawg<{ results: RawgMovie[] }>(`/games/${id}/movies`);
    return NextResponse.json({ results: data.results ?? [] });
  } catch (error) {
    console.error("RAWG movies error", error);
    const message = error instanceof Error ? error.message : "Unable to load RAWG trailers.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
