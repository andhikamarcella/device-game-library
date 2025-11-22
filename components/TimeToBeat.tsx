"use client";

import { cn } from "@/lib/utils";

type TimeToBeatProps = {
  ttb?: { hastly?: number | null; normally?: number | null; completely?: number | null } | null;
};

const formatMinutes = (minutes: number | null | undefined) => {
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes <= 0) {
    return "—";
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
};

export function TimeToBeat({ ttb }: TimeToBeatProps) {
  const hastly = ttb?.hastly ?? null;
  const normally = ttb?.normally ?? null;
  const completely = ttb?.completely ?? null;

  if (hastly === null && normally === null && completely === null) {
    return null;
  }

  const rows: Array<{ label: string; value: number | null }> = [
    { label: "Hastly", value: hastly },
    { label: "Normally", value: normally },
    { label: "Completely", value: completely },
  ];

  return (
    <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">Time To Beat</h2>
      <div className="divide-y divide-slate-200 text-sm text-slate-800 dark:divide-slate-800 dark:text-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
            <span className="text-slate-600 dark:text-slate-300">{row.label}</span>
            <span
              className={cn(
                "font-semibold text-slate-900 dark:text-white",
                row.value === null && "text-slate-400 dark:text-slate-500 font-normal",
              )}
            >
              {formatMinutes(row.value)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default TimeToBeat;
