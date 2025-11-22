import type { IgdbAgeRating } from "@/lib/igdb";

export type AgeRatingSystem = "ESRB" | "PEGI" | "CERO" | "GRAC" | "USK" | "CLASS_IND" | "ACB";

export type MappedAgeRating = {
  system: AgeRatingSystem;
  label: string;
  description: string;
  icon: string;
};

const ICONS: Record<AgeRatingSystem, string> = {
  ESRB: "/ratings/esrb.svg",
  PEGI: "/ratings/pegi.svg",
  CERO: "/ratings/cero.svg",
  GRAC: "/ratings/grac.svg",
  USK: "/ratings/usk.svg",
  CLASS_IND: "/ratings/classind.svg",
  ACB: "/ratings/acb.svg",
};

const ESRB_MAP: Record<number, { label: string; description: string }> = {
  6: { label: "RP", description: "Rating Pending" },
  7: { label: "EC", description: "Early Childhood" },
  8: { label: "E", description: "Everyone" },
  9: { label: "E10+", description: "Everyone 10 and older" },
  10: { label: "T", description: "Teen 13+" },
  11: { label: "M", description: "Mature 17+" },
  12: { label: "AO", description: "Adults Only 18+" },
};

const PEGI_MAP: Record<number, { label: string; description: string }> = {
  1: { label: "PEGI 3", description: "Suitable for ages 3 and up" },
  2: { label: "PEGI 7", description: "Suitable for ages 7 and up" },
  3: { label: "PEGI 12", description: "Suitable for ages 12 and up" },
  4: { label: "PEGI 16", description: "Suitable for ages 16 and up" },
  5: { label: "PEGI 18", description: "Adults only" },
};

const CERO_MAP: Record<number, { label: string; description: string }> = {
  13: { label: "A", description: "All ages" },
  14: { label: "B", description: "Ages 12 and up" },
  15: { label: "C", description: "Ages 15 and up" },
  16: { label: "D", description: "Ages 17 and up" },
  17: { label: "Z", description: "Ages 18 and up" },
};

const GRAC_MAP: Record<number, { label: string; description: string }> = {
  23: { label: "All", description: "All ages" },
  24: { label: "12", description: "Ages 12 and up" },
  25: { label: "15", description: "Ages 15 and up" },
  26: { label: "18", description: "Ages 18 and up" },
  27: { label: "Testing", description: "Pending final classification" },
};

const USK_MAP: Record<number, { label: string; description: string }> = {
  18: { label: "0", description: "Approved for all ages" },
  19: { label: "6", description: "Ages 6 and up" },
  20: { label: "12", description: "Ages 12 and up" },
  21: { label: "16", description: "Ages 16 and up" },
  22: { label: "18", description: "Restricted to adults" },
};

const CLASS_IND_MAP: Record<number, { label: string; description: string }> = {
  28: { label: "L", description: "Livre (all audiences)" },
  29: { label: "10", description: "Recommended for ages 10 and up" },
  30: { label: "12", description: "Recommended for ages 12 and up" },
  31: { label: "14", description: "Recommended for ages 14 and up" },
  32: { label: "16", description: "Recommended for ages 16 and up" },
  33: { label: "18", description: "Restricted to ages 18 and up" },
};

const ACB_MAP: Record<number, { label: string; description: string }> = {
  34: { label: "G", description: "General audiences" },
  35: { label: "PG", description: "Parental guidance recommended" },
  36: { label: "M", description: "Recommended for mature audiences" },
  37: { label: "MA15+", description: "Restricted to ages 15 and up" },
  38: { label: "R18+", description: "Restricted to adults 18+" },
  39: { label: "RC", description: "Refused classification" },
};

const mapWithFallback = (
  system: AgeRatingSystem,
  icon: string,
  entry?: { label: string; description: string },
): MappedAgeRating => ({
  system,
  icon,
  label: entry?.label ?? "Unrated",
  description: entry?.description ?? "No rating information provided",
});

export function mapEsrb(rating?: number | null): MappedAgeRating {
  const entry = rating != null ? ESRB_MAP[rating] : undefined;
  return mapWithFallback("ESRB", ICONS.ESRB, entry);
}

export function mapPegi(rating?: number | null): MappedAgeRating {
  const entry = rating != null ? PEGI_MAP[rating] : undefined;
  return mapWithFallback("PEGI", ICONS.PEGI, entry);
}

export function mapCero(rating?: number | null): MappedAgeRating {
  const entry = rating != null ? CERO_MAP[rating] : undefined;
  return mapWithFallback("CERO", ICONS.CERO, entry);
}

export function mapGrac(rating?: number | null): MappedAgeRating {
  const entry = rating != null ? GRAC_MAP[rating] : undefined;
  return mapWithFallback("GRAC", ICONS.GRAC, entry);
}

export function mapUsk(rating?: number | null): MappedAgeRating {
  const entry = rating != null ? USK_MAP[rating] : undefined;
  return mapWithFallback("USK", ICONS.USK, entry);
}

export function mapClassInd(rating?: number | null): MappedAgeRating {
  const entry = rating != null ? CLASS_IND_MAP[rating] : undefined;
  return mapWithFallback("CLASS_IND", ICONS.CLASS_IND, entry);
}

export function mapAcb(rating?: number | null): MappedAgeRating {
  const entry = rating != null ? ACB_MAP[rating] : undefined;
  return mapWithFallback("ACB", ICONS.ACB, entry);
}

export function mapAgeRating(rating: IgdbAgeRating | null | undefined): MappedAgeRating | null {
  if (!rating) return null;

  switch (rating.category) {
    case 1:
      return mapEsrb(rating.rating);
    case 2:
      return mapPegi(rating.rating);
    case 3:
      return mapCero(rating.rating);
    case 5:
      return mapGrac(rating.rating);
    case 4:
      return mapUsk(rating.rating);
    case 6:
      return mapClassInd(rating.rating);
    case 7:
      return mapAcb(rating.rating);
    default:
      return null;
  }
}
