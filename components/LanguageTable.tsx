"use client";

import type { GameLanguageSupport } from "@/lib/gameData";

type LanguageTableProps = {
  supports?: GameLanguageSupport[] | null;
};

export default function LanguageTable({ supports }: LanguageTableProps) {
  if (!supports?.length) return null;

  const rows = supports
    .map((support, index) => {
      if (!support) return null;
      const languageName = support.language?.name || "Unknown language";
      return {
        key: support.id ?? index,
        language: languageName,
        audio: support.audio,
        subtitles: support.subtitles,
        interface: support.interface,
      };
    })
    .filter((row): row is { key: number; language: string; audio: boolean; subtitles: boolean; interface: boolean } =>
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
                <td className="px-3 py-2 text-center">{row.audio ? "✓" : "—"}</td>
                <td className="px-3 py-2 text-center">{row.subtitles ? "✓" : "—"}</td>
                <td className="px-3 py-2 text-center">{row.interface ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
