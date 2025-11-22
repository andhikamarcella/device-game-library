import { igdbPost } from "@/lib/igdbClient";
import { igdbHD } from "@/lib/igdb-image";
import type { SearchGameResult } from "@/components/GameCard";
import { GameCard } from "@/components/GameCard";

type IgdbEventGame = {
  id: number;
  name: string;
  slug?: string | null;
  first_release_date?: number | null;
  cover?: { image_id?: string | null } | null;
};

const today = new Date();

function toGameCard(game: IgdbEventGame): SearchGameResult {
  const coverUrl = game.cover?.image_id ? igdbHD(game.cover.image_id) : null;
  const releaseYear = game.first_release_date
    ? new Date(Number(game.first_release_date) * 1000).getFullYear()
    : null;

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
    releaseYear,
    rating: null,
    ratingsCount: 0,
    platforms: [],
    genres: [],
    popularity: null,
  };
}

async function safeIgdbQuery(body: string): Promise<IgdbEventGame[]> {
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
  return safeIgdbQuery(body);
}

async function getAnniversaries(): Promise<IgdbEventGame[]> {
  const body = [
    "fields id,name,slug,first_release_date,cover.image_id;",
    "where first_release_date != null;",
    "sort rating_count desc;",
    "limit 60;",
  ].join("\n");
  const games = await safeIgdbQuery(body);
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
  return safeIgdbQuery(body);
}

function formatAnniversaryLabel(release: number | null | undefined): string | null {
  if (!release) return null;
  const releaseDate = new Date(Number(release) * 1000);
  const years = today.getFullYear() - releaseDate.getFullYear();
  if (years <= 0) return "Releasing";
  return `Celebrating ${years} year${years === 1 ? "" : "s"}`;
}

function EventGrid({ games, note }: { games: IgdbEventGame[]; note?: (game: IgdbEventGame) => string | null }) {
  if (!games.length) return null;
  return (
    <div className="grid grid-flow-col auto-cols-[70%] gap-4 overflow-x-auto pb-3 md:grid-flow-row md:auto-cols-auto md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {games.map((game) => {
        const label = note ? note(game) : null;
        return (
          <div key={game.id} className="space-y-2">
            <GameCard game={toGameCard(game)} />
            {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
          </div>
        );
      })}
    </div>
  );
}

export default async function EventsSection() {
  const [upcoming, anniversaries] = await Promise.all([getUpcomingReleases(), getAnniversaries()]);
  const fallback = !upcoming.length && !anniversaries.length ? await getNotableUpdates() : [];

  if (!upcoming.length && !anniversaries.length && !fallback.length) {
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

      {upcoming.length ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Upcoming Releases (next 30 days)</h3>
          <EventGrid games={upcoming} note={(game) => {
            const date = game.first_release_date ? new Date(Number(game.first_release_date) * 1000) : null;
            return date ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;
          }} />
        </div>
      ) : null}

      {anniversaries.length ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Anniversaries</h3>
          <EventGrid games={anniversaries} note={(game) => formatAnniversaryLabel(game.first_release_date)} />
        </div>
      ) : null}

      {!upcoming.length && !anniversaries.length && fallback.length ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Notable Updates</h3>
          <EventGrid games={fallback} />
        </div>
      ) : null}
    </section>
  );
}
