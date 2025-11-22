import { NextRequest, NextResponse } from "next/server";

import { buildIgdbQuery, getIgdbToken, type SortKey } from "@/lib/igdb";

export const dynamic = "force-dynamic";

const parseSortKey = (value: unknown): SortKey => {
  const normalized = typeof value === "string" ? value.trim() : "";

  const mapLegacy: Record<string, SortKey> = {
    popular: "most_popular",
    rating: "highest_rated",
    release_date: "newest",
    popular_desc: "most_popular",
    popular_asc: "least_popular",
    rating_desc: "highest_rated",
    rating_asc: "lowest_rated",
    release_desc: "newest",
    release_asc: "oldest",
  };

  const allowed: SortKey[] = [
    "none",
    "most_popular",
    "least_popular",
    "highest_rated",
    "lowest_rated",
    "newest",
    "oldest",
    "alphabetical",
  ];

  if (normalized && mapLegacy[normalized]) {
    return mapLegacy[normalized];
  }

  if (normalized && allowed.includes(normalized as SortKey)) {
    return normalized as SortKey;
  }

  return "none";
};

type SearchParams = {
  query?: string;
  sort?: string;
  platform?: string | number | null;
  platformId?: string | number | null;
};

const resolveSearchParams = (params: SearchParams) => {
  const query = params.query?.toString().trim() ?? "";
  const sort = parseSortKey(params.sort);
  const platformRaw = params.platform ?? params.platformId;
  const platformId =
    typeof platformRaw === "string" && platformRaw !== "all" && Number.isFinite(Number(platformRaw))
      ? Number(platformRaw)
      : typeof platformRaw === "number"
        ? platformRaw
        : null;

  return { query, sort, platformId };
};

async function executeSearch({ query, sort, platformId }: { query: string; sort: SortKey; platformId: number | null }) {
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
}

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const query = params.get("q") ?? params.get("query") ?? "";
    const sort = params.get("sort") ?? undefined;
    const platform = params.get("platformId") ?? params.get("platform") ?? undefined;

    const resolved = resolveSearchParams({ query, sort, platformId: platform });
    return await executeSearch(resolved);
  } catch (error) {
    console.error("IGDB games search error", error);
    return NextResponse.json({ error: "IGDB search failed", games: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = ((await req.json().catch(() => null)) || {}) as SearchParams;

    const resolved = resolveSearchParams(body);

    return await executeSearch(resolved);
  } catch (error) {
    console.error("IGDB games search error", error);
    return NextResponse.json({ error: "IGDB search failed", games: [] }, { status: 200 });
  }
}
