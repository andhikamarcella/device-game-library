import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Star } from "lucide-react";
import { getGameDetails } from "@/lib/rawg";
import type { RawgGameDetails } from "@/lib/rawg";

export const revalidate = 300;

type GameDetailPageProps = {
  params: { id: string };
};

export default async function GameDetailPage({ params }: GameDetailPageProps) {
  const id = Number.parseInt(params.id, 10);

  if (!Number.isFinite(id)) {
    notFound();
  }

  let game: RawgGameDetails;

  try {
    game = await getGameDetails(id);
  } catch (error) {
    if (error instanceof Error && /404/.test(error.message)) {
      notFound();
    }
    throw error;
  }

  const description = game.description_raw ?? game.description ?? "No description available.";
  const releaseDateLabel = (() => {
    if (!game.released) {
      return "Unknown";
    }
    const parsed = new Date(game.released);
    return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleDateString();
  })();
  const platformNames = game.platforms?.map((entry) => entry.platform.name).filter(Boolean) ?? [];
  const genres = game.genres?.map((genre) => genre.name).filter(Boolean) ?? [];
  const developers = game.developers?.map((developer) => developer.name).filter(Boolean) ?? [];
  const publishers = game.publishers?.map((publisher) => publisher.name).filter(Boolean) ?? [];
  const ratingLabel = Number.isFinite(game.rating) ? game.rating.toFixed(1) : "—";
  const ratingCountLabel = Number.isFinite(game.ratings_count) ? game.ratings_count : 0;

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60">
        {game.background_image ? (
          <div className="relative h-72 w-full overflow-hidden">
            <img src={game.background_image} alt={`${game.name} artwork`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
          </div>
        ) : null}
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">{game.name}</h1>
              <p className="text-sm text-slate-400">Released: {releaseDateLabel}</p>
              {platformNames.length ? (
                <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                  {platformNames.map((platform) => (
                    <span key={platform} className="rounded-full border border-slate-700 px-3 py-1">
                      {platform}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-amber-200">
              <Star className="h-5 w-5 fill-current" />
              <div>
                <p className="text-lg font-semibold">{ratingLabel}</p>
                <p className="text-xs text-amber-100/80">{ratingCountLabel} ratings</p>
              </div>
            </div>
          </div>

          {genres.length ? (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Genres</h2>
              <p className="mt-2 text-sm text-slate-300">{genres.join(", ")}</p>
            </div>
          ) : null}

          {developers.length ? (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Developers</h2>
              <p className="mt-2 text-sm text-slate-300">{developers.join(", ")}</p>
            </div>
          ) : null}

          {publishers.length ? (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Publishers</h2>
              <p className="mt-2 text-sm text-slate-300">{publishers.join(", ")}</p>
            </div>
          ) : null}

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-200">{description}</p>
          </div>

          {game.website ? (
            <div>
              <a
                href={game.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
              >
                <Globe className="h-4 w-4" /> Official website
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
