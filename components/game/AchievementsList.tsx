"use client";

import Image from "next/image";
import { useState } from "react";
import { Trophy } from "lucide-react";
import type { RawgAchievement } from "@/lib/rawg";

interface AchievementsListProps {
  achievements: RawgAchievement[];
  initialVisible?: number;
}

export function AchievementsList({ achievements, initialVisible = 10 }: AchievementsListProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? achievements : achievements.slice(0, initialVisible);
  const hasOverflow = achievements.length > initialVisible;

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {visible.map((achievement) => (
          <li
            key={achievement.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60"
          >
            {achievement.image ? (
              <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
                <Image src={achievement.image} alt="Achievement badge" fill className="object-cover" sizes="48px" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                <Trophy className="h-5 w-5" />
              </div>
            )}
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{achievement.name}</p>
              {achievement.description ? (
                <p className="text-xs text-slate-600 dark:text-slate-400">{achievement.description}</p>
              ) : null}
            </div>
            {typeof achievement.percent === "number" ? (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                {achievement.percent.toFixed(1)}%
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {hasOverflow ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300"
        >
          {expanded ? "Show fewer achievements" : "Show more achievements"}
        </button>
      ) : null}
    </div>
  );
}
