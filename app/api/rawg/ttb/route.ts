import { NextResponse } from "next/server";

const RAWG_BASE_URL = process.env.RAWG_BASE_URL ?? "https://api.rawg.io/api";

async function fetchJson(url: string) {
  const res = await fetch(url, { next: { revalidate: 60 * 30 } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`RAWG request failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function POST(req: Request) {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    console.warn("RAWG_API_KEY is not configured");
    return NextResponse.json({ main: null, extra: null, complete: null }, { status: 200 });
  }

  const body = await req.json().catch(() => null) as { title?: string } | null;
  const title = body?.title?.trim();

  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  try {
    const searchUrl = `${RAWG_BASE_URL}/games?key=${apiKey}&search=${encodeURIComponent(title)}`;
    const searchData = await fetchJson(searchUrl);
    const results = Array.isArray((searchData as any)?.results) ? (searchData as any).results : [];
    const match = results[0];

    if (!match?.id) {
      return NextResponse.json({ main: null, extra: null, complete: null }, { status: 200 });
    }

    const detailUrl = `${RAWG_BASE_URL}/games/${match.id}?key=${apiKey}`;
    const detail = await fetchJson(detailUrl);

    const main = typeof (detail as any)?.playtime_main === "number" ? (detail as any).playtime_main : null;
    const extra =
      typeof (detail as any)?.playtime_main_extra === "number" ? (detail as any).playtime_main_extra : null;
    const complete =
      typeof (detail as any)?.playtime_completionist === "number" ? (detail as any).playtime_completionist : null;

    return NextResponse.json({ main, extra, complete }, { status: 200 });
  } catch (error) {
    console.warn("RAWG TTB lookup failed", error);
    return NextResponse.json({ main: null, extra: null, complete: null }, { status: 200 });
  }
}

export const dynamic = "force-dynamic";
