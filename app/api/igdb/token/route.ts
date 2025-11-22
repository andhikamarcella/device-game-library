import { NextResponse } from "next/server";
import { getIgdbToken } from "@/lib/igdb";

export async function GET() {
  try {
    const token = await getIgdbToken();
    return NextResponse.json(token, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
