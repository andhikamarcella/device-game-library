import { NextResponse } from "next/server";
import { igdbRequest } from "@/lib/igdb";

export const dynamic = "force-dynamic";

export async function GET() {
  const query = `
    fields id,name,abbreviation,slug,generation;
    sort name asc;
    limit 500;
  `;

  try {
    console.log("[IGDB] Fetching platform list...");
    const platforms = await igdbRequest<Array<{
      id: number;
      name: string;
      abbreviation?: string | null;
      slug?: string | null;
      generation?: number | null;
    }>>("platforms", query);

    console.log("[IGDB] Platform list OK:", platforms.length, "items");
    return NextResponse.json({ platforms });
  } catch (err: unknown) {
    console.error("[IGDB] Platform lookup failed:", err);
    return NextResponse.json(
      {
        error: "IGDB platform lookup failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
