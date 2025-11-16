import type { RawgGame } from "@/lib/rawg";

interface SystemRequirementsProps {
  game: RawgGame;
}

export function SystemRequirements({ game }: SystemRequirementsProps) {
  const pcEntry = game.platforms?.find((entry) => entry.platform.slug === "pc");
  const requirements = pcEntry?.requirements;

  if (!requirements?.minimum && !requirements?.recommended) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300">
        System Requirements (PC)
      </h2>
      {requirements.minimum ? (
        <div className="rounded-lg border border-slate-700/30 bg-slate-800/40 p-4 text-sm text-slate-100 whitespace-pre-line">
          <span className="font-semibold text-slate-50">Minimum</span>
          {"\n"}
          {requirements.minimum}
        </div>
      ) : null}
      {requirements.recommended ? (
        <div className="rounded-lg border border-slate-700/30 bg-slate-800/40 p-4 text-sm text-slate-100 whitespace-pre-line">
          <span className="font-semibold text-slate-50">Recommended</span>
          {"\n"}
          {requirements.recommended}
        </div>
      ) : null}
    </section>
  );
}
