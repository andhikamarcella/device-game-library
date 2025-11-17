"use client";

import Image from "next/image";
import { useState } from "react";
import { Trophy, Youtube } from "lucide-react";
import type { GameAchievement } from "@/lib/gameData";

interface AchievementsListProps {
  achievements: GameAchievement[];
  initialVisible?: number;
  gameTitle: string;
}

const buildTutorialLink = (gameTitle: string, achievementName: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${gameTitle} ${achievementName} achievement guide`,
  )}`;

type AchievementGroup = {
  label: string;
  key: string;
  entries: GameAchievement[];
};

const buildGroups = (achievements: GameAchievement[]): AchievementGroup[] => {
  const groups = new Map<string, AchievementGroup>();
  achievements.forEach((achievement) => {
    const platforms = achievement.platforms.length
      ? achievement.platforms
      : [{ id: 0, name: "General" }];

    platforms.forEach((platform) => {
      const key = platform?.id ? String(platform.id) : "general";
      const label = platform?.name || "General";
      if (!groups.has(key)) {
        groups.set(key, { key, label, entries: [] });
      }
      groups.get(key)?.entries.push(achievement);
    });
  });

  return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label));
};

export function AchievementsList({ achievements, initialVisible = 4, gameTitle }: AchievementsListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const groups = buildGroups(achievements);

  if (!achievements.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
        Belum ada achievement untuk game ini.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const expanded = expandedGroups[group.key] ?? false;
        const visible = expanded ? group.entries : group.entries.slice(0, initialVisible);
        const hasOverflow = group.entries.length > initialVisible;

        return (
          <div key={group.key} className="space-y-3 rounded-2xl border border-slate-200 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <Trophy className="h-4 w-4" aria-hidden="true" />
                <span>{group.label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {group.entries.length}
                </span>
              </div>
              {hasOverflow ? (
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroups((prev) => ({
                      ...prev,
                      [group.key]: !expanded,
                    }))
                  }
                  className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300"
                >
                  {expanded ? "Tutup" : "Lihat selengkapnya"}
                </button>
              ) : null}
            </div>

            <ul className="space-y-3">
              {visible.map((achievement) => (
                <li
                  key={achievement.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
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
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {typeof achievement.percent === "number" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold dark:bg-slate-800/70">
                          <Trophy className="h-3 w-3" aria-hidden="true" />
                          {achievement.percent.toFixed(1)}% unlocked
                        </span>
                      ) : null}
                      <a
                        href={buildTutorialLink(gameTitle, achievement.name)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-300"
                      >
                        <Youtube className="h-3 w-3" aria-hidden="true" />
                        Watch tutorial
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {hasOverflow ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedGroups((prev) => ({
                    ...prev,
                    [group.key]: !expanded,
                  }))
                }
                className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-500 dark:text-emerald-300"
              >
                {expanded ? "Tutup" : "Tampilkan lebih banyak"}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
