"use client";

import { useMemo } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  value: number | null | undefined;
  onChange?: (value: number | null) => void;
  max?: number;
  readOnly?: boolean;
}

export function RatingStars({ value, onChange, max = 10, readOnly = false }: RatingStarsProps) {
  const activeValue = useMemo(() => {
    if (typeof value !== "number") {
      return 0;
    }
    return Math.min(Math.max(Math.round(value), 0), max);
  }, [value, max]);

  const handleClick = (nextValue: number) => {
    if (readOnly || !onChange) {
      return;
    }
    if (activeValue === nextValue) {
      onChange(null);
    } else {
      onChange(nextValue);
    }
  };

  return (
    <div className="flex items-center gap-1" aria-label="Personal rating">
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const filled = starValue <= activeValue;
        return (
          <button
            key={starValue}
            type="button"
            className={`h-6 w-6 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
              filled ? "text-amber-400" : "text-slate-400 dark:text-slate-500"
            } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
            onClick={() => handleClick(starValue)}
            disabled={readOnly}
            aria-pressed={filled}
          >
            <Star className="h-5 w-5" fill={filled ? "currentColor" : "none"} />
          </button>
        );
      })}
    </div>
  );
}
