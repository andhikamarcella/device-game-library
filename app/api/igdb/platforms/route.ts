import { NextResponse } from "next/server";

import { igdbFetch } from "@/lib/igdb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const body = `
      fields id, name, abbreviation, generation;
      sort name asc;
      limit 500;
    `;

    const platforms = await igdbFetch<any[]>("platforms", body);

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error("IGDB platform lookup error", error);
    return NextResponse.json(
      { error: "IGDB platform lookup failed" },
      { status: 500 },
    );
  }
}
