import { NextRequest, NextResponse } from "next/server";

import { igdbPost } from "@/lib/igdbClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = [
    "fields id,name,slug,description,logo.image_id,country,parent.*,developed.name,published.name;",
    `where id = ${id};`,
    "limit 1;",
  ].join("\n");

  try {
    const [company] = (await igdbPost("companies", body)) as any[];
    return NextResponse.json(company ?? null, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
