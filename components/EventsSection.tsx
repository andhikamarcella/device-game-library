"use client";

import { useEffect, useMemo, useState } from "react";

import { GameCardCompact, type CompactGameCardData } from "@/components/GameCardCompact";
import { igdbHD } from "@/lib/igdb-image";

type EventBucket = {
  anniversaries: IgdbEventGame[];
};

type IgdbEventGame = {
  id: number;
  name: string;
  slug?: string | null;
  first_release_date?: number | null;
  cover?: { image_id?: string | null } | null;
};

function toCompactCard(game: IgdbEventGame): CompactGameCardData {
  const releaseYear = game.first_release_date
    ? new Date(Number(game.first_release_date) * 1000).getFullYear()
    : null;

  const coverImageId = game.cover?.image_id ?? null;
  const coverUrl = coverImageId ? igdbHD(coverImageId) : null;

  return {
    id: game.id,
    name: game.name,
    coverImageId,
    coverUrl,
    rating: null,
    ratingsCount: 0,
    releaseYear,
    platforms: [],
  };
}

function formatAnniversaryLabel(release: number | null | undefined): string | null {
  if (!release) return null;
  const releaseDate = new Date(Number(release) * 1000);
  const years = new Date().getFullYear() - releaseDate.getFullYear();
  if (years <= 0) return "Releasing";
  return `Celebrating ${years} year${years === 1 ? "" : "s"}`;
}

function EventGrid({ games, note }: { games: IgdbEventGame[]; note?: (game: IgdbEventGame) => string | null }) {
  if (!games.length) return null;
  return (
    <div className="grid grid-flow-col auto-cols-[75%] gap-3 overflow-x-auto pb-3 sm:auto-cols-[55%] md:auto-cols-[45%] lg:auto-cols-[32%] xl:auto-cols-[26%]">
      {games.map((game) => {
        const label = note ? note(game) : null;
        return (
          <div key={game.id} className="space-y-2">
            <GameCardCompact
              game={toCompactCard(game)}
              footer={label ? <p className="text-xs text-muted-foreground">{label}</p> : null}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function EventsSection() {
  const [events, setEvents] = useState<EventBucket>({ anniversaries: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/igdb/events", { method: "POST" });
        const json = (await res.json()) as Partial<EventBucket> & { error?: string };
        if (cancelled || json?.error) return;
        setEvents({
          anniversaries: Array.isArray(json.anniversaries) ? json.anniversaries : [],
        });
      } catch (error) {
        console.warn("Failed to fetch events", error);
        if (!cancelled) {
          setEvents({ anniversaries: [] });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasAny = useMemo(
    () => events.anniversaries.length > 0,
    [events],
  );

  if (!loading && !hasAny) {
    return (
      <section className="space-y-4 rounded-2xl border border-border bg-card/60 p-6 shadow-lg">
        <h2 className="text-xl font-semibold">Game Events</h2>
        <p className="text-muted-foreground">No event data available right now.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card/60 p-6 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Game Events</h2>
      </div>

      {loading ? (
        <div className="grid grid-flow-col auto-cols-[75%] gap-3 overflow-x-auto pb-3 sm:auto-cols-[55%] md:auto-cols-[45%] lg:auto-cols-[32%] xl:auto-cols-[26%]">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-72 animate-pulse rounded-2xl border border-border/60 bg-muted/40 shadow-inner"
            />
          ))}
        </div>
      ) : null}

      {!loading && events.anniversaries.length ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Anniversaries</h3>
          <EventGrid
            games={events.anniversaries}
            note={(game) => formatAnniversaryLabel(game.first_release_date)}
          />
        </div>
      ) : null}

    </section>
  );
}
