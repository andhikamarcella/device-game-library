import { NextRequest, NextResponse } from "next/server";
import { igdbPost } from "@/lib/igdbClient";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const body = ["fields *;", `where id = ${id};`, "limit 1;"].join("\n");
    const [franchise] = (await igdbPost("franchises", body)) as unknown[];
    return NextResponse.json(franchise, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
