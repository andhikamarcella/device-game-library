import { NextRequest, NextResponse } from "next/server";

import { igdbPost } from "@/lib/igdbClient";

export const dynamic = "force-dynamic";

type IgdbEventGame = {
  id: number;
  name: string;
  slug?: string | null;
  first_release_date?: number | null;
  cover?: { image_id?: string | null } | null;
};

async function safeQuery(body: string): Promise<IgdbEventGame[]> {
  try {
    const data = await igdbPost("games", body);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn("IGDB events query failed", error);
    return [];
  }
}

async function getUpcomingReleases(): Promise<IgdbEventGame[]> {
  const now = Math.floor(Date.now() / 1000);
  const next30 = now + 30 * 24 * 60 * 60;
  const body = [
    "fields id,name,slug,first_release_date,cover.image_id;",
    `where first_release_date != null & first_release_date > ${now} & first_release_date < ${next30};`,
    "sort first_release_date asc;",
    "limit 12;",
  ].join("\n");
  return safeQuery(body);
}

async function getAnniversaries(): Promise<IgdbEventGame[]> {
  const body = [
    "fields id,name,slug,first_release_date,cover.image_id;",
    "where first_release_date != null;",
    "sort rating_count desc;",
    "limit 60;",
  ].join("\n");
  const games = await safeQuery(body);
  const today = new Date();
  return games.filter((game) => {
    if (!game.first_release_date) return false;
    const date = new Date(Number(game.first_release_date) * 1000);
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
  });
}

async function getNotableUpdates(): Promise<IgdbEventGame[]> {
  const body = [
    "fields id,name,slug,first_release_date,cover.image_id;",
    "sort rating_count desc;",
    "limit 12;",
  ].join("\n");
  return safeQuery(body);
}

export async function POST(_req: NextRequest) {
  const [upcoming, anniversaries] = await Promise.all([getUpcomingReleases(), getAnniversaries()]);
  const fallback = !upcoming.length && !anniversaries.length ? await getNotableUpdates() : [];

  return NextResponse.json({ upcoming, anniversaries, fallback });
}
