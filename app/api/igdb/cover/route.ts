import { NextResponse } from "next/server";
import { searchIgdbGameCoverByName } from "@/lib/igdb";

interface CoverRequestBody {
  name?: string;
  fallbackImage?: string | null;
}

export async function POST(request: Request) {
  let payload: CoverRequestBody;
  try {
    payload = (await request.json()) as CoverRequestBody;
  } catch (error) {
    console.error("IGDB cover API payload error", error);
    return NextResponse.json({ coverUrl: null, fallbackImage: null }, { status: 400 });
  }

  const name = payload.name?.trim();
  const fallbackImage = payload.fallbackImage ?? null;

  if (!name) {
    return NextResponse.json({ coverUrl: null, fallbackImage }, { status: 400 });
  }

  try {
    const coverUrl = await searchIgdbGameCoverByName(name);
    return NextResponse.json({ coverUrl, fallbackImage });
  } catch (error) {
    console.error("IGDB cover API error", error);
    return NextResponse.json({ coverUrl: null, fallbackImage }, { status: 500 });
  }
}
