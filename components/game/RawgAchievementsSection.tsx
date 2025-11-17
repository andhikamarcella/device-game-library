"use client";

import { useEffect, useState } from "react";
import type { RawgAchievement } from "@/lib/rawg";

type AchievementsProps = {
  rawgId?: number | string | null;
};

export function RawgAchievementsSection({ rawgId }: AchievementsProps) {
  const [achievements, setAchievements] = useState<RawgAchievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rawgId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/rawg/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawgId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;

        if (data.error) {
          setError(data.error);
          setAchievements([]);
        } else {
          setAchievements(Array.isArray(data.achievements) ? data.achievements : []);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setError("Gagal memuat achievements");
          setAchievements([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rawgId]);

  if (!rawgId) {
    return null;
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100">Achievements (RAWG)</h2>
        {loading && <span className="text-xs text-slate-400">Loading…</span>}
      </div>

      {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

      {!loading && !error && achievements.length === 0 && (
        <p className="text-xs text-slate-400">No achievements found for this game.</p>
      )}

      {!loading && achievements.length > 0 && (
        <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {achievements
            .slice()
            .sort((a, b) => {
              const ao = a.ordering ?? 0;
              const bo = b.ordering ?? 0;
              return ao - bo;
            })
            .map((ach) => (
              <li key={ach.id} className="flex gap-3 rounded-lg bg-slate-900/60 p-2">
                {ach.image ? (
                  <div className="h-10 w-10 flex-none overflow-hidden rounded-md bg-slate-800">
                    <img src={ach.image} alt={ach.name} className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-slate-100">{ach.name}</p>
                    {typeof ach.percent === "number" && (
                      <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200">
                        {ach.percent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {ach.description && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-400">{ach.description}</p>
                  )}
                </div>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
