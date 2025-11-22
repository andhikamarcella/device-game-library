import type { IgdbAgeRating } from "../igdb";

const IGDB_ICON_BASE = "https://www.igdb.com/icons/rating_icons";

const CATEGORY_SLUGS: Record<number, { slug: string; system: string }> = {
  1: { slug: "esrb", system: "ESRB" },
  2: { slug: "pegi", system: "PEGI" },
  3: { slug: "cero", system: "CERO" },
  4: { slug: "grac", system: "GRAC" },
  5: { slug: "classind", system: "CLASS_IND" },
  6: { slug: "acb", system: "ACB" },
  7: { slug: "usk", system: "USK" },
};

type AgeRatingDescriptor = {
  category: number;
  label: string;
  description: string;
  code: string;
};

const RATING_DETAILS: Record<number, AgeRatingDescriptor> = {
  1: { category: 2, label: "PEGI 3", description: "Suitable for all ages", code: "3" },
  2: { category: 2, label: "PEGI 7", description: "Fear or mild violence for young children", code: "7" },
  3: { category: 2, label: "PEGI 12", description: "Moderate violence or mild language", code: "12" },
  4: { category: 2, label: "PEGI 16", description: "Realistic violence or sexual content", code: "16" },
  5: { category: 2, label: "PEGI 18", description: "Graphic violence or adult themes", code: "18" },

  6: { category: 1, label: "RP", description: "Rating pending", code: "rp" },
  7: { category: 1, label: "EC", description: "Early Childhood", code: "ec" },
  8: { category: 1, label: "E", description: "Everyone", code: "e" },
  9: { category: 1, label: "E10+", description: "Everyone 10+", code: "e10" },
  10: { category: 1, label: "T", description: "Teen 13+", code: "t" },
  11: { category: 1, label: "M", description: "Mature 17+", code: "m" },
  12: { category: 1, label: "AO", description: "Adults Only 18+", code: "ao" },

  13: { category: 3, label: "A", description: "All ages", code: "a" },
  14: { category: 3, label: "B", description: "Ages 12+", code: "b" },
  15: { category: 3, label: "C", description: "Ages 15+", code: "c" },
  16: { category: 3, label: "D", description: "Ages 17+", code: "d" },
  17: { category: 3, label: "Z", description: "Adults 18+", code: "z" },

  18: { category: 7, label: "0", description: "All ages", code: "0" },
  19: { category: 7, label: "6", description: "Ages 6+", code: "6" },
  20: { category: 7, label: "12", description: "Ages 12+", code: "12" },
  21: { category: 7, label: "16", description: "Ages 16+", code: "16" },
  22: { category: 7, label: "18", description: "Adults 18+", code: "18" },

  23: { category: 4, label: "ALL", description: "All ages", code: "all" },
  24: { category: 4, label: "12", description: "Ages 12+", code: "12" },
  25: { category: 4, label: "15", description: "Ages 15+", code: "15" },
  26: { category: 4, label: "18", description: "Adults 18+", code: "18" },
  27: { category: 4, label: "TESTING", description: "Provisional rating", code: "test" },

  28: { category: 5, label: "L", description: "All ages", code: "l" },
  29: { category: 5, label: "10", description: "Ages 10+", code: "10" },
  30: { category: 5, label: "12", description: "Ages 12+", code: "12" },
  31: { category: 5, label: "14", description: "Ages 14+", code: "14" },
  32: { category: 5, label: "16", description: "Ages 16+", code: "16" },
  33: { category: 5, label: "18", description: "Ages 18+", code: "18" },

  34: { category: 6, label: "G", description: "General", code: "g" },
  35: { category: 6, label: "PG", description: "Parental guidance", code: "pg" },
  36: { category: 6, label: "M", description: "Mature themes", code: "m" },
  37: { category: 6, label: "MA15+", description: "Mature accompaniment 15+", code: "ma15" },
  38: { category: 6, label: "R18+", description: "Restricted 18+", code: "r18" },
  39: { category: 6, label: "RC", description: "Refused classification", code: "rc" },
};

export type MappedAgeRating = {
  key: number;
  system: string;
  label: string;
  description: string;
  icon: string;
  synopsis: string | null;
};

const sanitizeUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return url;
};

export function mapAgeRatingsToDisplay(ageRatings?: IgdbAgeRating[] | null): MappedAgeRating[] {
  if (!ageRatings?.length) return [];

  const mapped: MappedAgeRating[] = [];
  const seen = new Set<string>();

  for (const entry of ageRatings) {
    if (!entry) continue;
    const ratingCode = typeof entry.rating === "number" ? entry.rating : Number.parseInt(`${entry.rating ?? ""}`, 10);
    if (!Number.isFinite(ratingCode)) continue;

    const descriptor = RATING_DETAILS[ratingCode];
    const category = typeof entry.category === "number" && CATEGORY_SLUGS[entry.category]
      ? entry.category
      : descriptor?.category;
    if (!category || !CATEGORY_SLUGS[category]) continue;

    const systemInfo = CATEGORY_SLUGS[category];
    const label = descriptor?.label ?? `${systemInfo.system} ${ratingCode}`;
    const description = descriptor?.description ?? systemInfo.system;
    const code = descriptor?.code ?? `${ratingCode}`;

    const icon = entry.rating_cover_url
      ? sanitizeUrl(entry.rating_cover_url)
      : `${IGDB_ICON_BASE}/${systemInfo.slug}/${systemInfo.slug}_${code.toLowerCase()}.png`;

    const key = entry.id ?? Number(`${category}${ratingCode}`);
    const dedupeKey = `${systemInfo.system}-${label}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    mapped.push({
      key,
      system: systemInfo.system,
      label,
      description,
      icon,
      synopsis: entry.synopsis?.trim() || null,
    });
  }

  return mapped;
}
