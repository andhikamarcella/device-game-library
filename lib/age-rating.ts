export const AGE_RATING_MAP = {
  1: { system: "ESRB", icon: "/ratings/esrb.svg" },
  2: { system: "PEGI", icon: "/ratings/pegi.svg" },
  3: { system: "CERO", icon: "/ratings/cero.svg" },
  4: { system: "GRAC", icon: "/ratings/grac.svg" },
  5: { system: "USK", icon: "/ratings/usk.svg" },
  6: { system: "ACB", icon: "/ratings/acb.svg" },
  7: { system: "CLASS_IND", icon: "/ratings/classind.svg" },
} as const;

export type AgeRatingCategory = keyof typeof AGE_RATING_MAP;

export type AgeRatingMeta = (typeof AGE_RATING_MAP)[AgeRatingCategory];

type AgeLabelMap = Record<number | string, string>;

export const AGE_RATING_LABELS: Record<AgeRatingCategory, AgeLabelMap> = {
  1: {
    6: "Rating Pending",
    7: "Early Childhood",
    8: "Everyone",
    9: "Everyone 10+",
    10: "Teen",
    11: "Mature 17+",
    12: "Adults Only",
  },
  2: {
    1: "PEGI 3",
    2: "PEGI 7",
    3: "PEGI 12",
    4: "PEGI 16",
    5: "PEGI 18",
    7: "PEGI 7",
    12: "PEGI 12",
    16: "PEGI 16",
    18: "PEGI 18",
  },
  3: {
    13: "A (All Ages)",
    14: "B (Ages 12+)",
    15: "C (Ages 15+)",
    16: "D (Ages 17+)",
    17: "Z (Ages 18+)",
  },
  4: {
    23: "All Ages",
    24: "Ages 12+",
    25: "Ages 15+",
    26: "Adults Only",
    27: "Testing",
    0: "All Ages",
    12: "Ages 12+",
    15: "Ages 15+",
    18: "Adults Only",
  },
  5: {
    18: "USK 0",
    19: "USK 6",
    20: "USK 12",
    21: "USK 16",
    22: "USK 18",
    0: "USK 0",
    6: "USK 6",
    12: "USK 12",
    16: "USK 16",
    18: "USK 18",
  },
  6: {
    34: "G",
    35: "PG",
    36: "M",
    37: "MA15+",
    38: "R18+",
    39: "RC",
    13: "PG",
    15: "MA15+",
    18: "R18+",
  },
  7: {
    28: "L",
    29: "10",
    30: "12",
    31: "14",
    32: "16",
    33: "18",
    0: "Free",
    10: "10+",
    12: "12+",
    14: "14+",
    16: "16+",
    18: "18+",
  },
};

export function resolveAgeLabel(
  category: number | null | undefined,
  rating: number | null | undefined,
): string {
  if (!category || !Object.hasOwn(AGE_RATING_LABELS, category)) return "Rating Unknown";

  const categoryKey = category as AgeRatingCategory;
  const labelMap = AGE_RATING_LABELS[categoryKey];
  if (!labelMap) return "Rating Unknown";
  if (rating == null) return "Rating Unknown";
  const direct = labelMap[rating];
  if (direct) return direct;
  const asStringKey = String(rating);
  return labelMap[asStringKey] ?? "Rating Unknown";
}
