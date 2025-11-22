export type AgeRatingInfo = {
  system: "ESRB" | "PEGI" | "CERO" | "USK" | "GRAC" | "CLASS_IND" | "ACB";
  label: string;
  icon: string;
};

export const AGE_RATING_MAP: Record<number, AgeRatingInfo> = {
  // PEGI
  1: { system: "PEGI", label: "3", icon: "/ratings/pegi.svg" },
  2: { system: "PEGI", label: "7", icon: "/ratings/pegi.svg" },
  3: { system: "PEGI", label: "12", icon: "/ratings/pegi.svg" },
  4: { system: "PEGI", label: "16", icon: "/ratings/pegi.svg" },
  5: { system: "PEGI", label: "18", icon: "/ratings/pegi.svg" },

  // ESRB
  6: { system: "ESRB", label: "RP", icon: "/ratings/esrb.svg" },
  7: { system: "ESRB", label: "EC", icon: "/ratings/esrb.svg" },
  8: { system: "ESRB", label: "E", icon: "/ratings/esrb.svg" },
  9: { system: "ESRB", label: "E10+", icon: "/ratings/esrb.svg" },
  10: { system: "ESRB", label: "T", icon: "/ratings/esrb.svg" },
  11: { system: "ESRB", label: "M", icon: "/ratings/esrb.svg" },
  12: { system: "ESRB", label: "AO", icon: "/ratings/esrb.svg" },

  // CERO (Japan)
  13: { system: "CERO", label: "A", icon: "/ratings/cero.svg" },
  14: { system: "CERO", label: "B", icon: "/ratings/cero.svg" },
  15: { system: "CERO", label: "C", icon: "/ratings/cero.svg" },
  16: { system: "CERO", label: "D", icon: "/ratings/cero.svg" },
  17: { system: "CERO", label: "Z", icon: "/ratings/cero.svg" },

  // USK (Germany)
  18: { system: "USK", label: "0", icon: "/ratings/usk.svg" },
  19: { system: "USK", label: "6", icon: "/ratings/usk.svg" },
  20: { system: "USK", label: "12", icon: "/ratings/usk.svg" },
  21: { system: "USK", label: "16", icon: "/ratings/usk.svg" },
  22: { system: "USK", label: "18", icon: "/ratings/usk.svg" },

  // GRAC (Korea)
  23: { system: "GRAC", label: "ALL", icon: "/ratings/grac.svg" },
  24: { system: "GRAC", label: "12", icon: "/ratings/grac.svg" },
  25: { system: "GRAC", label: "15", icon: "/ratings/grac.svg" },
  26: { system: "GRAC", label: "18", icon: "/ratings/grac.svg" },
  27: { system: "GRAC", label: "Testing", icon: "/ratings/grac.svg" },

  // Brazil (ClassInd)
  28: { system: "CLASS_IND", label: "L", icon: "/ratings/classind.svg" },
  29: { system: "CLASS_IND", label: "10", icon: "/ratings/classind.svg" },
  30: { system: "CLASS_IND", label: "12", icon: "/ratings/classind.svg" },
  31: { system: "CLASS_IND", label: "14", icon: "/ratings/classind.svg" },
  32: { system: "CLASS_IND", label: "16", icon: "/ratings/classind.svg" },
  33: { system: "CLASS_IND", label: "18", icon: "/ratings/classind.svg" },

  // ACB (Australia)
  34: { system: "ACB", label: "G", icon: "/ratings/acb.svg" },
  35: { system: "ACB", label: "PG", icon: "/ratings/acb.svg" },
  36: { system: "ACB", label: "M", icon: "/ratings/acb.svg" },
  37: { system: "ACB", label: "MA15+", icon: "/ratings/acb.svg" },
  38: { system: "ACB", label: "R18+", icon: "/ratings/acb.svg" },
  39: { system: "ACB", label: "RC", icon: "/ratings/acb.svg" },
};
