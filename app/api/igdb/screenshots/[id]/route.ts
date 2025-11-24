import { NextRequest, NextResponse } from "next/server";
import { igdbPost } from "@/lib/igdbClient";

export const dynamic = "force-dynamic";

async function fetchScreenshots(id: number) {
  const body = ["fields *;", `where game = ${id};`, "limit 50;"].join("\n");
  return igdbPost("screenshots", body);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const data = await fetchScreenshots(id);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const data = await fetchScreenshots(id);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
