import { NextRequest, NextResponse } from "next/server";

import { igdbFetch } from "@/lib/igdb";

export async function GET(_req: NextRequest) {
  try {
    const body = [
      "fields id,name,abbreviation,generation,platform_logo.image_id;",
      "sort name asc;",
      "limit 200;",
    ].join("\n");

    const platforms = await igdbFetch<any[]>("platforms", body);

    return NextResponse.json(platforms, { status: 200 });
  } catch (error) {
    console.error("Platform route fatal error", error);
    return NextResponse.json(
      { error: "Unexpected server error while loading platforms" },
      { status: 500 },
    );
  }
}
