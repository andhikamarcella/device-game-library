import Image from "next/image";
import { mapAgeRating, type MappedAgeRating } from "@/lib/ageRatingMap";
import type { IgdbAgeRating } from "@/lib/igdb";

interface AgeRatingProps {
  ageRatings?: IgdbAgeRating[] | null;
}

const dedupeRatings = (ratings: MappedAgeRating[]): MappedAgeRating[] => {
  const map = new Map<string, MappedAgeRating>();
  ratings.forEach((rating) => {
    const key = `${rating.system}-${rating.label}`;
    if (!map.has(key)) {
      map.set(key, rating);
    }
  });
  return Array.from(map.values());
};

export function AgeRating({ ageRatings }: AgeRatingProps) {
  const mapped = dedupeRatings(
    (ageRatings ?? [])
      .map((rating) => mapAgeRating(rating))
      .filter((entry): entry is MappedAgeRating => Boolean(entry)),
  );

  if (!mapped.length) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No age rating information available for this game.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {mapped.map((rating) => (
        <div
          key={`${rating.system}-${rating.label}`}
          className="group flex items-center gap-4 rounded-2xl border border-slate-200/70 bg-white/60 p-4 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/70"
        >
          <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/30 bg-white/80 p-2 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/80">
            <Image src={rating.icon} alt={`${rating.system} ${rating.label}`} width={56} height={56} className="object-contain" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {rating.system}: {rating.label}
            </p>
            <p className="text-xs text-slate-600 transition group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300">
              {rating.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
