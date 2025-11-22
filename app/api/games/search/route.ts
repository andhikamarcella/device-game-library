import { NextRequest, NextResponse } from "next/server";

import { buildIgdbQuery, getIgdbToken, type SortKey } from "@/lib/igdb";

export const dynamic = "force-dynamic";

const parseSortKey = (value: unknown): SortKey => {
  const allowed: SortKey[] = [
    "none",
    "most_popular",
    "highest_rated",
    "newest",
    "oldest",
    "alphabetical",
  ];

  if (typeof value === "string" && allowed.includes(value as SortKey)) {
    return value as SortKey;
  }

  return "none";
};

export async function POST(req: NextRequest) {
  try {
    const body = ((await req.json().catch(() => null)) || {}) as {
      query?: string;
      sort?: string;
      platform?: string;
    };

    const query = body.query?.trim() ?? "";
    const sort = parseSortKey(body.sort);
    const platformId =
      body.platform && body.platform !== "all" && Number.isFinite(Number(body.platform))
        ? Number(body.platform)
        : null;

    const { accessToken, clientId } = await getIgdbToken();

    const igdbQuery = buildIgdbQuery({
      searchText: query,
      sort,
      platformId,
    });

    const igdbRes = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: igdbQuery,
    });

    if (!igdbRes.ok) {
      const text = await igdbRes.text().catch(() => "");
      console.error("IGDB games search error", igdbRes.status, text);
      return NextResponse.json({ error: "IGDB search failed", games: [] }, { status: 200 });
    }

    const games = (await igdbRes.json().catch(() => [])) as unknown[];

    return NextResponse.json(
      {
        games,
        results: games,
        pagination: {
          total: games.length,
          page: 1,
          pageSize: games.length,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("IGDB games search error", error);
    return NextResponse.json({ error: "IGDB search failed", games: [] }, { status: 200 });
  }
}
