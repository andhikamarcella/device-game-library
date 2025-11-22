"use client";

import type { GameLanguageSupport } from "@/lib/gameData";

const normalizeFlags = (value?: number | number[] | null): number[] => {
  if (Array.isArray(value)) return value.filter((item): item is number => typeof item === "number");
  if (typeof value === "number" && Number.isFinite(value)) return [value];
  return [];
};

const hasFlag = (value: number | number[] | undefined, target: number) =>
  normalizeFlags(value).includes(target);

type LanguageTableProps = {
  supports?: GameLanguageSupport[] | null;
};

export default function LanguageTable({ supports }: LanguageTableProps) {
  if (!supports?.length) return null;

  const rows = supports
    .map((support) => {
      if (!support) return null;
      const languageName = support.language?.name || "Unknown language";
      return {
        key: support.id,
        language: languageName,
        audio: normalizeFlags(support.audio),
        subtitles: normalizeFlags(support.subtitles),
        interface: normalizeFlags(support.interface),
      };
    })
    .filter((row): row is { key: number; language: string; audio: number[]; subtitles: number[]; interface: number[] } =>
      Boolean(row),
    );

  if (!rows.length) return null;

  return (
    <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
        Supported languages
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-slate-800 dark:text-slate-100">
          <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr className="border-b border-slate-200/70 dark:border-slate-800/70">
              <th className="px-3 py-2 text-left">Language</th>
              <th className="px-3 py-2 text-center">Audio</th>
              <th className="px-3 py-2 text-center">Subtitles</th>
              <th className="px-3 py-2 text-center">Interface</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr
                key={row.key ?? idx}
                className="border-b border-slate-200/60 last:border-0 dark:border-slate-800/60"
              >
                <td className="px-3 py-2 font-medium">{row.language}</td>
                <td className="px-3 py-2 text-center">{hasFlag(row.audio, 1) ? "✓" : "—"}</td>
                <td className="px-3 py-2 text-center">{hasFlag(row.subtitles, 2) ? "✓" : "—"}</td>
                <td className="px-3 py-2 text-center">{hasFlag(row.interface, 3) ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
