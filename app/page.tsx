import { Suspense } from "react";

import EventsSection from "@/components/EventsSection";
import { GameCard, type SearchGameResult } from "@/components/GameCard";
import { igdbHD } from "@/lib/igdb-image";
import { formatCountdown, formatDaysAgo, daysSince, daysUntil } from "@/utils/date";

type IgdbPlatform = { id?: number; name?: string; slug?: string | null };
type IgdbGame = {
  id: number;
  name: string;
  slug?: string | null;
  cover?: { image_id?: string | null } | null;
  aggregated_rating?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  platforms?: IgdbPlatform[] | null;
  first_release_date?: number | null;
};

const GRID_CLASSES =
  "grid grid-flow-col auto-cols-[70%] gap-4 overflow-x-auto pb-2 md:grid-flow-row md:auto-cols-auto md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5";

const toCard = (game: IgdbGame): SearchGameResult => {
  const coverUrl = game.cover?.image_id ? igdbHD(game.cover.image_id) : null;
  const platforms = Array.isArray(game.platforms)
    ? game.platforms
        .map((platform) => ({
          id: platform?.id ?? 0,
          name: platform?.name ?? "Unknown",
          slug: platform?.slug ?? platform?.name ?? "",
          abbreviation: platform?.slug ?? platform?.name ?? undefined,
        }))
        .filter((p) => Boolean(p.name))
    : [];

  return {
    id: game.id,
    slug: game.slug ?? null,
    name: game.name,
    summary: "",
    cover: game.cover,
    coverUrl,
    coverImageUrl: coverUrl,
    screenshots: [],
    screenshotUrls: [],
    releaseYear: game.first_release_date
      ? new Date(Number(game.first_release_date) * 1000).getFullYear()
      : null,
    rating:
      typeof game.aggregated_rating === "number"
        ? game.aggregated_rating
        : typeof game.rating === "number"
          ? game.rating
          : null,
    ratingsCount: game.rating_count ?? 0,
    platforms,
    genres: [],
    popularity: null,
  };
};

async function fetchIgdb(endpoint: string, revalidateSeconds = 3600): Promise<IgdbGame[]> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(`Failed to load ${endpoint}`, error);
    return [];
  }
}

function SectionSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={GRID_CLASSES}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="h-72 animate-pulse rounded-2xl bg-muted/40 shadow-inner shadow-black/10"
        />
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card/60 p-6 shadow-lg">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function GameGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className={GRID_CLASSES}>
      {children}
    </div>
  );
}

async function Top100Section() {
  const games = (await fetchIgdb("/api/igdb/top100"))
    .slice(0, 100)
    .map(toCard);
  if (!games.length) return null;

  return (
    <Section title="Top 100 Games">
      <GameGrid>
        {games.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </GameGrid>
    </Section>
  );
}

async function ComingSoonSection() {
  const games = await fetchIgdb("/api/igdb/coming-soon");
  if (!games.length) return null;
  return (
    <Section title="Coming Soon">
      <GameGrid>
        {games.map((game) => {
          const countdown = formatCountdown(daysUntil(game.first_release_date ?? null));
          return (
            <div key={game.id} className="space-y-2">
              <GameCard game={toCard(game)} />
              {countdown ? <p className="text-sm text-muted-foreground">{countdown}</p> : null}
            </div>
          );
        })}
      </GameGrid>
    </Section>
  );
}

async function RecentlyReleasedSection() {
  const games = await fetchIgdb("/api/igdb/recent");
  if (!games.length) return null;
  return (
    <Section title="Recently Released">
      <GameGrid>
        {games.map((game) => {
          const days = formatDaysAgo(daysSince(game.first_release_date ?? null));
          return (
            <div key={game.id} className="space-y-2">
              <GameCard game={toCard(game)} />
              {days ? <p className="text-sm text-muted-foreground">{days}</p> : null}
            </div>
          );
        })}
      </GameGrid>
    </Section>
  );
}

export default function HomePage() {
  return (
    <main className="space-y-10 px-4 pb-10 pt-8 sm:px-6 lg:px-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Discover Games</h1>
        <p className="text-muted-foreground">Browse top rated releases, upcoming titles, and special events powered by IGDB.</p>
      </div>

      <Suspense fallback={<SectionSkeleton count={8} />}>
        <Top100Section />
      </Suspense>

      <Suspense fallback={<SectionSkeleton count={6} />}>
        <ComingSoonSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton count={6} />}>
        <RecentlyReleasedSection />
      </Suspense>

      <Suspense fallback={<SectionSkeleton count={4} />}>
        <EventsSection />
      </Suspense>
    </main>
  );
}
